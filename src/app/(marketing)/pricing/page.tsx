export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center p-8 text-center pt-24">
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        Simple, transparent pricing
      </h1>
      <p className="text-muted-foreground max-w-xl mx-auto mb-12">
        Tracker AI is currently in early access beta. All features are free for
        current users.
      </p>

      <div className="w-full max-w-md rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        <h3 className="text-xl font-semibold mb-2">Early Access</h3>
        <div className="flex items-baseline justify-center gap-1 mb-6">
          <span className="text-5xl font-bold tracking-tighter">₹0</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <ul className="space-y-4 text-sm text-left mb-8">
          <li className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Unlimited
            Expenses
          </li>
          <li className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Full AI
            Assistant Access
          </li>
          <li className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Advanced
            Budget Analytics
          </li>
        </ul>
      </div>
    </div>
  );
}
