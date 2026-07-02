import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthBar } from "./components/AuthBar";
import { DemoBanner } from "./components/DemoBanner";
import { Fridge } from "./components/Fridge";
import { PlanCatalog } from "./components/PlanCatalog";
import { MealPlanner } from "./components/MealPlanner";
import { OnboardingModal } from "./components/OnboardingModal";
import { CookbookFab } from "./components/CookbookFab";
import { LandingPage } from "./components/LandingPage";
import type { MealPlanResponse, MealPlanSummary } from "./types";

interface OpenedPlan {
  plan: MealPlanResponse;
  summary: MealPlanSummary;
}

function MainLayout() {
  const { userId, onboardingCompleted, isDemo, logout, email } = useAuth();
  // openedPlan and other component-local state in this subtree are scoped to a
  // single user session — see AuthRoot below for the userId-keyed remount that
  // discards them on logout/login transitions.
  const [openedPlan, setOpenedPlan] = useState<OpenedPlan | null>(null);

  return (
    <div style={{ backgroundColor: "#F5F5F7", minHeight: "100vh", fontFamily: "var(--apple-font-body)" }}>
      {/* Premium Dashboard Header */}
      <header className="ios-glass" style={{ 
        position: "sticky", 
        top: 0, 
        zIndex: 100, 
        height: 48, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "0 24px",
        borderBottom: "1px solid rgba(0, 0, 0, 0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg viewBox="0 0 14 44" width="14" height="44" style={{ display: "block", color: "var(--apple-blue)" }}>
            <path d="m13.0729 17.6825a3.61 3.61 0 0 0 -1.7248 3.0365 3.5132 3.5132 0 0 0 2.1379 3.2223 8.394 8.394 0 0 1 -1.0948 2.2618c-.6816.9812-1.3943%201.9623-2.4787%201.9623s-1.3633-.63-2.613-.63c-1.2187%200-1.6525.6507-2.644.6507s-1.6834-.9089-2.4787-2.0243a9.7842%209.7842%200%200%201%20-1.6628-5.2776c0-3.0984%202.014-4.7405%203.9969-4.7405%201.0535%200%201.9314.6919%202.5924.6919.63%200%201.6112-.7333%202.8092-.7333a3.7579%203.7579%200%200%201%203.1604%201.5802zm-3.7284-2.8918a3.5615%203.5615%200%200%200%20.8469-2.22%201.5353%201.5353%200%200%200%20-.031-.32%203.5686%203.5686%200%200%200%20-2.3445%201.2084%203.4629%203.4629%200%200%200%20-.8779%202.1585%201.419%201.419%200%200%200%20.031.2892%201.19%201.19%200%200%200%20.2169.0207%203.0935%203.0935%200%200%200%202.1586-1.1368z" fill="currentColor" />
          </svg>
          <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--apple-text-primary)" }}>Mealbot Dashboard</span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "14px", color: "var(--apple-text-secondary)" }}>{email}</span>
          <button 
            onClick={logout} 
            className="secondary" 
            style={{ padding: "6px 12px", borderRadius: "18px", fontSize: "13px" }}
          >
            Log Out
          </button>
        </div>
      </header>

      <DemoBanner />
      
      <div style={{ maxWidth: 960, margin: "0 auto", padding: isDemo ? "72px 1rem 4rem" : "3rem 1rem 4rem" }}>
        <h1 style={{ marginBottom: "28px", fontSize: "36px", letterSpacing: "-0.02em", color: "var(--apple-text-primary)" }}>🤖 Mealbot Planner</h1>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
          <AuthBar />
          
          <div className="ios-card" style={{ padding: "30px 24px" }}>
            <Fridge />
          </div>
          
          <div className="ios-card" style={{ padding: "30px 24px" }}>
            <PlanCatalog onOpenPlan={(plan, summary) => setOpenedPlan({ plan, summary })} />
          </div>

          <div className="ios-card" style={{ padding: "30px 24px" }}>
            <MealPlanner
              key={openedPlan?.plan.plan_id ?? "new"}
              initialPlan={openedPlan?.plan ?? null}
              initialSummary={openedPlan?.summary}
              onExitPlan={() => setOpenedPlan(null)}
            />
          </div>
        </div>

        {userId && !onboardingCompleted && !isDemo && <OnboardingModal />}
        {userId && <CookbookFab />}
      </div>
    </div>
  );
}

function AuthRoot() {
  const { userId } = useAuth();
  
  if (!userId) {
    return <LandingPage />;
  }
  
  // Remounts the entire authenticated subtree when the active user changes,
  // so no component-local state from a previous session survives login/logout.
  return <MainLayout key={userId} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthRoot />
      </AuthProvider>
    </ErrorBoundary>
  );
}
