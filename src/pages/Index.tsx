import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Eye, CheckCircle, Upload, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: Upload,
      title: 'Photo & Text Submissions',
      description: 'Upload images or describe your lost item in detail for accurate matching.',
    },
    {
      icon: Shield,
      title: 'Secure Private Inventory',
      description: 'Our catalog remains hidden to prevent false claims and fraud attempts.',
    },
    {
      icon: Eye,
      title: 'AI-Powered Matching',
      description: 'Advanced algorithms cross-reference your inquiry against our database.',
    },
    {
      icon: CheckCircle,
      title: 'Verified Recovery',
      description: 'Trained assistants verify matches before connecting you with your item.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Submit Your Inquiry',
      description: 'Describe your lost item or upload photos for identification.',
    },
    {
      number: '02',
      title: 'AI Analysis',
      description: 'Our system searches the private inventory for potential matches.',
    },
    {
      number: '03',
      title: 'Expert Review',
      description: 'Trained assistants verify potential matches for accuracy.',
    },
    {
      number: '04',
      title: 'Secure Recovery',
      description: 'Once verified, we connect you with your recovered item.',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(175_60%_40%/0.08),transparent_50%)]" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6 animate-fade-in">
              <Shield className="h-4 w-4" />
              Trusted Lost & Found Recovery
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-slide-up">
              Recover Your Lost Items{' '}
              <span className="text-gradient-primary">Securely</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Submit an inquiry via photo or description. Our AI-powered system 
              cross-references your submission against a private, secure inventory 
              to find matches while preventing fraud.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button 
                variant="hero" 
                size="xl" 
                onClick={() => navigate('/submit')}
                className="w-full sm:w-auto"
              >
                <Search className="h-5 w-5 mr-2" />
                Report Lost Item
              </Button>
              {user ? (
                <Button 
                  variant="outline" 
                  size="xl" 
                  onClick={() => navigate('/track')}
                  className="w-full sm:w-auto"
                >
                  Track My Inquiries
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="xl" 
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto"
                >
                  Sign In
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative gradient orb */}
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-accent/10 to-primary/5 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              How FindSecure Protects You
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our system is designed with privacy and security at its core, 
              ensuring only legitimate claims result in item recovery.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group glass-card rounded-xl p-6 hover:border-accent/50 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="h-12 w-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Simple Recovery Process
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From submission to recovery, our streamlined process ensures 
              efficiency while maintaining the highest security standards.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="text-6xl font-display font-bold text-accent/20 mb-4">
                  {step.number}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-accent/30 to-transparent -translate-x-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(175_60%_40%/0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl mx-auto text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-6 text-accent" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Lost Something Important?
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Don't wait—submit your inquiry now. The sooner you report, 
              the higher the chance of a successful match and recovery.
            </p>
            <Button 
              variant="hero" 
              size="xl" 
              onClick={() => navigate('/submit')}
            >
              Start Your Inquiry
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
