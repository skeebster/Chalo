import { Navbar } from "@/components/Navbar";
import { usePlans } from "@/hooks/use-plans";
import { Loader2, Calendar } from "lucide-react";

export default function Planner() {
  const { data: plans, isLoading } = usePlans();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onUploadClick={() => {}} />
      
      <main className="container mx-auto px-4 pt-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold text-white">Your Weekend Plans</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !plans?.length ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-white/5">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No plans yet</h3>
            <p className="text-muted-foreground">Start by exploring destinations and adding them to a plan.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-card p-6 rounded-xl border border-white/10">
                <p className="text-white">Plan for {new Date(plan.planDate).toLocaleDateString()}</p>
                <p className="text-muted-foreground text-sm">{plan.status}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
