import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inquiryId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from("inquiries")
      .select("*")
      .eq("id", inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      throw new Error("Inquiry not found");
    }

    // Fetch all unclaimed inventory items
    const { data: items, error: itemsError } = await supabase
      .from("lost_items")
      .select("*")
      .eq("is_claimed", false);

    if (itemsError) throw itemsError;
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ matchCount: 0, matches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt for AI matching
    const inquiryDetails = `
Title: ${inquiry.title}
Description: ${inquiry.description}
Category: ${inquiry.category || "Not specified"}
Color: ${inquiry.color || "Not specified"}
Brand: ${inquiry.brand || "Not specified"}
Distinguishing Features: ${inquiry.distinguishing_features || "None"}
Location Lost: ${inquiry.location_lost || "Not specified"}
`;

    const inventoryList = items.map((item, i) => `
Item ${i + 1} (ID: ${item.id}):
- Name: ${item.name}
- Description: ${item.description || "N/A"}
- Category: ${item.category}
- Color: ${item.color || "N/A"}
- Brand: ${item.brand || "N/A"}
- Features: ${item.distinguishing_features || "N/A"}
- Location Found: ${item.location_found || "N/A"}
`).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for a lost and found system. Analyze the user's lost item inquiry and compare it against the inventory to find potential matches. Return a JSON array of matches with confidence scores (0-100). Only return items with confidence >= 40. Format: [{"itemId": "uuid", "confidence": 85, "reasons": ["reason1", "reason2"]}]`,
          },
          {
            role: "user",
            content: `Lost Item Inquiry:\n${inquiryDetails}\n\nInventory Items:\n${inventoryList}\n\nReturn JSON array of potential matches.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", errText);
      throw new Error("AI matching failed");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";
    
    // Parse AI response
    let matches = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        matches = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Parse error:", e);
    }

    // Store matches in database
    for (const match of matches) {
      await supabase.from("potential_matches").upsert({
        inquiry_id: inquiryId,
        lost_item_id: match.itemId,
        confidence_score: match.confidence,
        match_reasons: { reasons: match.reasons || [] },
      }, { onConflict: "inquiry_id,lost_item_id" });
    }

    // Update inquiry with highest confidence and number of matches
    if (matches.length > 0) {
      const maxConfidence = Math.max(...matches.map((m: any) => m.confidence));
      await supabase
        .from("inquiries")
        .update({ confidence_score: maxConfidence, number_of_matches: matches.length })
        .eq("id", inquiryId);
    } else {
      // ensure counts cleared when no matches
      await supabase
        .from("inquiries")
        .update({ confidence_score: null, number_of_matches: 0 })
        .eq("id", inquiryId);
    }

    return new Response(JSON.stringify({ matchCount: matches.length, matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
