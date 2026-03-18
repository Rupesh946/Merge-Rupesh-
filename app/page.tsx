import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Github,
  Code2,
  Newspaper,
  MessageSquare,
  Star,
  GitFork,
  ArrowRight,
  Quote,
  Minus,
  X
} from "lucide-react";
import Link from "next/link";
import FaultyTerminal from '@/components/FaultyTerminal';
import { HeaderAuthButtons, HeroAuthButtons, CtaAuthButtons } from "@/components/landing-auth-buttons";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Asymmetric Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-primary/20">
        <div className="max-w-8xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-5 h-5 bg-foreground flex items-center justify-center">
                <Minus className="h-2 w-2 text-background" />
              </div>
              <span className="text-base font-light tracking-[0.2em]">MERGE</span>
            </div>
            <nav className="hidden lg:flex items-center space-x-16">
              <Link href="#platform" className="text-xs font-light text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.15em]">
                Platform
              </Link>
              <Link href="#work" className="text-xs font-light text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.15em]">
                Work
              </Link>
              <Link href="#community" className="text-xs font-light text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.15em]">
                Community
              </Link>
            </nav>
            <HeaderAuthButtons />
          </div>
        </div>
      </header>

      {/* Unconventional Hero */}
      <section className="min-h-screen pt-16 px-8 relative overflow-hidden">
        {/* Interactive Background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Animated Grid */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            animation: 'gridMove 30s linear infinite'
          }}></div>

          {/* Floating Code Symbols with Blue Accents */}
          <div className="absolute top-1/4 left-1/4 text-primary/20 text-6xl font-mono animate-pulse select-none">
            {'{}'}
          </div>
          <div className="absolute top-1/3 right-1/3 text-primary/15 text-4xl font-mono animate-pulse select-none" style={{ animationDelay: '2s' }}>
            {'</>'}
          </div>
          <div className="absolute bottom-1/3 left-1/3 text-primary/25 text-5xl font-mono animate-pulse select-none" style={{ animationDelay: '4s' }}>
            {'()'}
          </div>
          <div className="absolute top-1/2 right-1/4 text-primary/10 text-3xl font-mono animate-pulse select-none" style={{ animationDelay: '6s' }}>
            {'[]'}
          </div>

          {/* Blue Particles */}
          <div className="absolute top-1/4 right-1/2 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-primary/30 rounded-full animate-ping" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-primary/50 rounded-full animate-ping" style={{ animationDelay: '5s' }}></div>
        </div>

        {/* Static Design Elements */}
        <div className="absolute top-32 right-16 text-[200px] font-extralight text-muted-foreground/5 select-none">
          01
        </div>
        <div className="absolute bottom-32 left-16 w-px h-32 bg-border/30"></div>

        <div className="max-w-8xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-center min-h-[85vh]">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-7 pt-8">
              <div className="mb-12">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-8 h-px bg-primary"></div>
                  <Badge variant="outline" className="px-3 py-1 text-xs font-light border-primary/40 text-primary uppercase tracking-[0.15em]">
                    Developer Space
                  </Badge>
                </div>

                <h1 className="text-7xl md:text-8xl lg:text-9xl font-extralight mb-12 cinematic-hero tracking-[-0.04em] leading-[0.85]">
                  WHERE
                  <br />
                  <span className="text-muted-foreground">CODE</span>
                  <br />
                  LIVES
                </h1>
              </div>

              <div className="max-w-lg space-y-8">
                <p className="text-lg font-light text-muted-foreground story-text leading-relaxed">
                  A space for developers who appreciate beautiful code, thoughtful design,
                  and meaningful work. Show your craft, share your insights, connect with peers.
                </p>

                <HeroAuthButtons />
              </div>
            </div>

            {/* Right Column - Faulty Terminal */}
            <div className="lg:col-span-5 pt-8">
              <div className="space-y-8">
                {/* Faulty Terminal Container */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <FaultyTerminal
                      scale={1.8}
                      gridMul={[3, 1]}
                      digitSize={1.4}
                      timeScale={1}
                      pause={false}
                      scanlineIntensity={1.2}
                      glitchAmount={1.2}
                      flickerAmount={1}
                      noiseAmp={1}
                      chromaticAberration={0}
                      dither={0}
                      curvature={0}
                      tint="#0065b1"
                      mouseReact={true}
                      mouseStrength={0.5}
                      pageLoadAnimation={false}
                      brightness={1.4}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features - Editorial Layout */}
      <section id="platform" className="py-32 px-8 border-t border-border/20 relative">
        <div className="absolute top-16 right-8 text-xs font-mono text-muted-foreground/30">
          02
        </div>

        <div className="max-w-8xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16">
            {/* Section Header */}
            <div className="lg:col-span-4">
              <div className="sticky top-32">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-6 h-px bg-primary/60"></div>
                  <span className="text-xs font-light text-primary uppercase tracking-[0.2em]">
                    Features
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-light mb-8 cinematic-text tracking-[-0.02em] leading-tight">
                  BUILT FOR
                  <br />
                  <span className="text-muted-foreground">CRAFT</span>
                </h2>
                <p className="text-base font-light text-muted-foreground story-text max-w-sm">
                  Tools that respect your work. Features that enhance your craft.
                  A space that values quality over quantity.
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="lg:col-span-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-primary/20 bg-card/30 hover-lift">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-8 h-8 bg-primary/20 flex items-center justify-center">
                        <Code2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-xs font-mono text-primary/50">01</div>
                    </div>
                    <CardTitle className="text-lg font-light mb-3">Project Showcase</CardTitle>
                    <CardDescription className="text-sm font-light text-muted-foreground story-text">
                      Sync your GitHub repositories automatically. Add custom descriptions,
                      live demos, and showcase your craft.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-border/20 bg-card/30 hover-lift">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-8 h-8 bg-muted/30 flex items-center justify-center">
                        <Quote className="h-4 w-4" />
                      </div>
                      <div className="text-xs font-mono text-muted-foreground/50">02</div>
                    </div>
                    <CardTitle className="text-lg font-light mb-3">Developer Insights</CardTitle>
                    <CardDescription className="text-sm font-light text-muted-foreground story-text">
                      Share your insights through posts with markdown support,
                      syntax highlighting, and rich media.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-border/20 bg-card/30 hover-lift">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-8 h-8 bg-muted/30 flex items-center justify-center">
                        <Newspaper className="h-4 w-4" />
                      </div>
                      <div className="text-xs font-mono text-muted-foreground/50">03</div>
                    </div>
                    <CardTitle className="text-lg font-light mb-3">Curated News</CardTitle>
                    <CardDescription className="text-sm font-light text-muted-foreground story-text">
                      Stay updated with curated tech content from trusted sources.
                      Never miss important developments.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-border/20 bg-card/30 hover-lift">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-8 h-8 bg-muted/30 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="text-xs font-mono text-muted-foreground/50">04</div>
                    </div>
                    <CardTitle className="text-lg font-light mb-3">Direct Connect</CardTitle>
                    <CardDescription className="text-sm font-light text-muted-foreground story-text">
                      Message other developers directly. Send collaboration requests
                      and connect with peers.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Featured Work - Asymmetric Layout */}
      < section id="work" className="py-32 px-8 border-t border-primary/20 relative" >
        <div className="absolute top-16 left-8 text-xs font-mono text-muted-foreground/30">
          03
        </div>

        <div className="max-w-8xl mx-auto">
          {/* Section Header */}
          <div className="mb-20">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-6 h-px bg-primary/60"></div>
                  <span className="text-xs font-light text-primary uppercase tracking-[0.2em]">
                    Featured Work
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-light cinematic-text tracking-[-0.02em] leading-tight">
                  DISCOVER
                  <br />
                  <span className="text-muted-foreground">AMAZING WORK</span>
                </h2>
              </div>
              <div className="hidden md:block text-sm font-light text-muted-foreground">
                Curated by developers, for developers
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="border-border/20 bg-card/20 hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="font-light border-border/30 text-xs uppercase tracking-[0.1em]">
                    Featured
                  </Badge>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground font-mono">
                    <Star className="h-3 w-3" />
                    <span>2.1k</span>
                  </div>
                </div>
                <CardTitle className="text-lg font-light mb-3">Neural Network Visualizer</CardTitle>
                <CardDescription className="font-light text-muted-foreground story-text text-sm mb-6">
                  Real-time visualization of neural network training processes.
                  Built with Three.js and WebGL shaders for maximum performance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge variant="outline" className="font-light border-border/30 text-xs">TypeScript</Badge>
                  <Badge variant="outline" className="font-light border-border/30 text-xs">WebGL</Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <div className="w-4 h-4 bg-muted/50 rounded-full" />
                  <span className="font-mono">@neural_dev</span>
                  <X className="h-2 w-2" />
                  <span>3 days ago</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/20 bg-card/20 hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="font-light border-border/30 text-xs uppercase tracking-[0.1em]">
                    Trending
                  </Badge>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground font-mono">
                    <GitFork className="h-3 w-3" />
                    <span>847</span>
                  </div>
                </div>
                <CardTitle className="text-lg font-light mb-3">Quantum State Manager</CardTitle>
                <CardDescription className="font-light text-muted-foreground story-text text-sm mb-6">
                  State management inspired by quantum mechanics principles.
                  Superposition meets React in this experimental library.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge variant="outline" className="font-light border-border/30 text-xs">React</Badge>
                  <Badge variant="outline" className="font-light border-border/30 text-xs">Quantum</Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <div className="w-4 h-4 bg-muted/50 rounded-full" />
                  <span className="font-mono">@quantum_coder</span>
                  <X className="h-2 w-2" />
                  <span>1 week ago</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/20 bg-card/20 hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="font-light border-border/30 text-xs uppercase tracking-[0.1em]">
                    Experimental
                  </Badge>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground font-mono">
                    <Star className="h-3 w-3" />
                    <span>1.3k</span>
                  </div>
                </div>
                <CardTitle className="text-lg font-light mb-3">Poetic Code Generator</CardTitle>
                <CardDescription className="font-light text-muted-foreground story-text text-sm mb-6">
                  AI that writes code like poetry. Where functionality meets beauty
                  in perfect harmony. The future of expressive programming.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge variant="outline" className="font-light border-border/30 text-xs">Python</Badge>
                  <Badge variant="outline" className="font-light border-border/30 text-xs">AI</Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <div className="w-4 h-4 bg-muted/50 rounded-full" />
                  <span className="font-mono">@code_poet</span>
                  <X className="h-2 w-2" />
                  <span>5 days ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section >

      {/* Call to Action - Minimal */}
      < section id="community" className="py-32 px-8 border-t border-primary/20 relative" >
        <div className="absolute top-16 right-8 text-xs font-mono text-muted-foreground/30">
          04
        </div>

        <div className="max-w-8xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-8 h-px bg-primary"></div>
                <span className="text-xs font-light text-primary uppercase tracking-[0.2em]">
                  Access
                </span>
              </div>

              <h2 className="text-5xl md:text-6xl font-light mb-8 cinematic-text tracking-[-0.02em] leading-tight">
                READY TO
                <br />
                <span className="text-muted-foreground">ENTER?</span>
              </h2>

              <p className="text-lg font-light text-muted-foreground story-text mb-12 max-w-lg">
                Connect your GitHub and join a space that celebrates
                thoughtful code, elegant design, and meaningful work.
              </p>

              <CtaAuthButtons />
            </div>

            <div className="lg:col-span-5">
              <div className="space-y-6 text-right">
                <div className="text-xs font-light text-muted-foreground uppercase tracking-[0.2em]">
                  Core Values
                </div>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex items-center justify-end space-x-3">
                    <span>Code is art</span>
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-end space-x-3">
                    <span>Design matters</span>
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-end space-x-3">
                    <span>Craft over competition</span>
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-end space-x-3">
                    <span>Quality over quantity</span>
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Editorial Footer */}
      < footer className="border-t border-primary/20 py-20 px-8" >
        <div className="max-w-8xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-4 h-4 bg-foreground flex items-center justify-center">
                  <Minus className="h-1 w-1 text-background" />
                </div>
                <span className="text-sm font-light tracking-[0.2em]">MERGE</span>
              </div>
              <p className="text-sm font-light text-muted-foreground story-text max-w-xs">
                A space for developers who appreciate craft.
                Built with obsessive attention to detail.
              </p>
            </div>

            <div className="lg:col-span-8">
              <div className="grid md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-xs font-light mb-6 text-muted-foreground uppercase tracking-[0.15em]">Product</h3>
                  <ul className="space-y-3 text-sm font-light text-muted-foreground">
                    <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                    <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                    <li><Link href="#" className="hover:text-foreground transition-colors">API</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-light mb-6 text-muted-foreground uppercase tracking-[0.15em]">Community</h3>
                  <ul className="space-y-3 text-sm font-light text-muted-foreground">
                    <li><Link href="#" className="hover:text-foreground transition-colors">Discord</Link></li>
                    <li><Link href="#" className="hover:text-foreground transition-colors">Twitter</Link></li>
                    <li><Link href="#" className="hover:text-foreground transition-colors">GitHub</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-light mb-6 text-muted-foreground uppercase tracking-[0.15em]">Support</h3>
                  <ul className="space-y-3 text-sm font-light text-muted-foreground">
                    <li><Link href="#" className="hover:text-foreground transition-colors">Help</Link></li>
                    <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
                    <li><Link href="#" className="hover:text-foreground transition-colors">Status</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-light mb-6 text-muted-foreground uppercase tracking-[0.15em]">Legal</h3>
                  <ul className="space-y-3 text-sm font-light text-muted-foreground">
                    <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                    <li><Link href="#" className="hover:text-foreground transition-colors">Terms</Link></li>
                    <li><Link href="#" className="hover:text-foreground transition-colors">Cookies</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-primary/20 flex items-center justify-between">
            <p className="text-xs font-light text-muted-foreground uppercase tracking-[0.15em]">
              © 2025 Merge
            </p>
            <div className="text-xs font-mono text-muted-foreground/50">
              v1.0.0
            </div>
          </div>
        </div>
      </footer >
    </div >
  );
}