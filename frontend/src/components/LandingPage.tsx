import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { mergeFridgeItems } from "../api";
import type { StockItem } from "../types";

// Import generated premium assets
import zeroWasteImg from "../assets/zero_waste_benefit.png";
import nutritionImg from "../assets/smart_nutrition_benefit.png";
import chefImg from "../assets/chef_quality_benefit.png";

type ScanState = "idle" | "dragging" | "scanning" | "review";
type TabType = "fridge" | "receipt";

interface ScannedIngredient {
  name: string;
  quantity: number;
}

const PRESET_INGREDIENTS: ScannedIngredient[] = [
  { name: "Avocado", quantity: 300 },
  { name: "Chicken Breast", quantity: 500 },
  { name: "Eggs", quantity: 360 },
  { name: "Roma Tomatoes", quantity: 400 },
  { name: "Fresh Spinach", quantity: 200 },
  { name: "Lemon", quantity: 100 },
];

function ScrollFridge() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const rect = scrollRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementTop = rect.top;
      
      // Calculate scroll fraction: starts opening at 85% of viewport, fully open at 35%
      const startTrigger = viewportHeight * 0.85;
      const endTrigger = viewportHeight * 0.35;
      
      let progress = 0;
      if (elementTop < startTrigger) {
        progress = (startTrigger - elementTop) / (startTrigger - endTrigger);
      }
      
      const clampedProgress = Math.min(1, Math.max(0, progress));
      scrollRef.current.style.setProperty("--scroll-fraction", clampedProgress.toString());
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fridge-scroller-container" ref={scrollRef} style={{ margin: 0 }}>
      {/* Refrigerator 3D Box */}
      <div className="fridge-box" style={{ margin: "0 auto" }}>
        {/* Left Door */}
        <div className="fridge-door fridge-door-left">
          <div className="fridge-badge">Mealbot</div>
          <div className="fridge-handle fridge-handle-left"></div>
        </div>

        {/* Right Door */}
        <div className="fridge-door fridge-door-right">
          <div className="fridge-handle fridge-handle-right"></div>
        </div>

        {/* Refrigerator Interior */}
        <div className="fridge-interior">
          <div className="fridge-interior-light"></div>
          
          {/* Top Shelf */}
          <div className="fridge-shelf">
            <span className="fridge-item" title="Milk" style={{"--item-x": -1} as React.CSSProperties}>🥛</span>
            <span className="fridge-item" title="Eggs" style={{"--item-x": 0} as React.CSSProperties}>🥚</span>
            <span className="fridge-item" title="Cheese" style={{"--item-x": 1} as React.CSSProperties}>🧀</span>
          </div>

          {/* Middle Shelf */}
          <div className="fridge-shelf">
            <span className="fridge-item" title="Salmon" style={{"--item-x": -1.2} as React.CSSProperties}>🐟</span>
            <span className="fridge-item" title="Beef" style={{"--item-x": 0} as React.CSSProperties}>🥩</span>
            <span className="fridge-item" title="Tomatoes" style={{"--item-x": 1.2} as React.CSSProperties}>🍅</span>
          </div>

          {/* Bottom Shelf */}
          <div className="fridge-shelf" style={{ borderBottom: "none" }}>
            <span className="fridge-item" title="Broccoli" style={{"--item-x": -1} as React.CSSProperties}>🥦</span>
            <span className="fridge-item" title="Lemon" style={{"--item-x": 0} as React.CSSProperties}>🍋</span>
            <span className="fridge-item" title="Spinach" style={{"--item-x": 1} as React.CSSProperties}>🥬</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { 
    userId, 
    login, 
    register, 
    loginDemo, 
    registrationEnabled,
    logout,
    email
  } = useAuth();

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [activeTab, setActiveTab] = useState<TabType>("fridge");
  const [ingredients, setIngredients] = useState<ScannedIngredient[]>(PRESET_INGREDIENTS);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientQty, setNewIngredientQty] = useState("");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState("");
  
  // Auth Dialog state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated scan triggers
  const startSimulatedScan = () => {
    setScanState("scanning");
    setScanProgress(0);
    setScanStep("Analyzing image colors & shapes...");
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      
      if (progress === 30) {
        setScanStep("Detecting refrigerator shelves...");
      } else if (progress === 60) {
        setScanStep("Identifying fresh ingredients...");
      } else if (progress === 85) {
        setScanStep("Estimating portion sizes in grams...");
      } else if (progress >= 100) {
        clearInterval(interval);
        setScanState("review");
      }
    }, 120);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (scanState === "idle") setScanState("dragging");
  };

  const handleDragLeave = () => {
    if (scanState === "dragging") setScanState("idle");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (scanState === "dragging" || scanState === "idle") {
      startSimulatedScan();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      startSimulatedScan();
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Ingredient Adjusters
  const updateQty = (index: number, delta: number) => {
    const updated = [...ingredients];
    updated[index].quantity = Math.max(0, updated[index].quantity + delta);
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredientName.trim()) return;
    const qty = parseFloat(newIngredientQty) || 100;
    setIngredients([...ingredients, { name: newIngredientName.trim(), quantity: qty }]);
    setNewIngredientName("");
    setNewIngredientQty("");
  };

  // Diet Plan Generation Handler
  const handleGeneratePlan = async () => {
    try {
      // Map list to StockItem format
      const itemsToSave: StockItem[] = ingredients.map(ing => ({
        name: ing.name,
        quantity_grams: ing.quantity,
        need_to_use: false,
        expiration_date: null
      }));

      if (!userId) {
        // Magical Onboarding: If not logged in, auto-login into demo session
        await loginDemo();
      }
      
      // Save items directly to user fridge
      await mergeFridgeItems(itemsToSave);
      
      // Force page refresh or layout update to load main planner
      window.location.reload();
    } catch (err) {
      console.error("Failed to generate plan:", err);
      alert("Something went wrong while setting up your diet plan. Please try again.");
    }
  };

  // Auth Submit Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === "login") {
        await login(inputEmail, inputPassword);
      } else {
        if (inputPassword.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
        await register(inputEmail, inputPassword);
      }
      setShowAuthModal(false);
      setInputPassword("");
      // Refresh to enter the planner
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#FFFFFF", minHeight: "100vh", fontFamily: "var(--apple-font-body)" }}>
      {/* Sticky Header */}
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
        {/* Branding Area */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg viewBox="0 0 14 44" width="14" height="44" style={{ display: "block", color: "var(--apple-blue)" }}>
            <path d="m13.0729 17.6825a3.61 3.61 0 0 0 -1.7248 3.0365 3.5132 3.5132 0 0 0 2.1379 3.2223 8.394 8.394 0 0 1 -1.0948 2.2618c-.6816.9812-1.3943%201.9623-2.4787%201.9623s-1.3633-.63-2.613-.63c-1.2187%200-1.6525.6507-2.644.6507s-1.6834-.9089-2.4787-2.0243a9.7842%209.7842%200%200%201%20-1.6628-5.2776c0-3.0984%202.014-4.7405%203.9969-4.7405%201.0535%200%201.9314.6919%202.5924.6919.63%200%201.6112-.7333%202.8092-.7333a3.7579%203.7579%200%200%201%203.1604%201.5802zm-3.7284-2.8918a3.5615%203.5615%200%200%200%20.8469-2.22%201.5353%201.5353%200%200%200%20-.031-.32%203.5686%203.5686%200%200%200%20-2.3445%201.2084%203.4629%203.4629%200%200%200%20-.8779%202.1585%201.419%201.419%200%200%200%20.031.2892%201.19%201.19%200%200%200%20.2169.0207%203.0935%203.0935%200%200%200%202.1586-1.1368z" fill="currentColor" />
          </svg>
          <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--apple-text-primary)" }}>Mealbot</span>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {userId ? (
            <>
              <span style={{ fontSize: "14px", color: "var(--apple-text-secondary)" }}>{email}</span>
              <button 
                onClick={logout} 
                className="secondary" 
                style={{ padding: "6px 12px", borderRadius: "18px", fontSize: "13px" }}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => { setAuthMode("login"); setShowAuthModal(true); }} 
                className="secondary" 
                style={{ padding: "6px 14px", borderRadius: "18px", fontSize: "13px", height: "30px" }}
              >
                Sign In
              </button>
              {registrationEnabled && (
                <button 
                  onClick={() => { setAuthMode("register"); setShowAuthModal(true); }} 
                  className="primary" 
                  style={{ padding: "6px 14px", borderRadius: "18px", fontSize: "13px", height: "30px" }}
                >
                  Start Free
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1060px", margin: "0 auto", padding: "60px 24px 80px" }}>
        {/* Split Hero Section */}
        <section className="ios-hero-grid">
          {/* Left Side: Animated Scrolling Fridge */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ScrollFridge />
          </div>

          {/* Right Side: Title & Description */}
          <div className="hero-text-wrapper" style={{ textAlign: "left" }}>
            <div style={{ 
              textTransform: "uppercase", 
              letterSpacing: "0.15em", 
              color: "var(--apple-blue)", 
              fontSize: "14px", 
              fontWeight: 700,
              marginBottom: "12px"
            }}>
              Mealbot
            </div>
            <h1 style={{ 
              fontSize: "44px", 
              fontWeight: 850, 
              lineHeight: 1.1, 
              letterSpacing: "-0.03em", 
              marginBottom: "20px",
              color: "var(--apple-text-primary)"
            }}>
              Extract protein from what you have.
            </h1>
            <p style={{ 
              fontSize: "18px", 
              lineHeight: 1.45, 
              fontWeight: 400, 
              marginBottom: "32px", 
              color: "var(--apple-text-secondary)"
            }}>
              Create your diet by scanning your fridge. Upload a single photo of your ingredients, and Mealbot will instantly formulate a personalized diet plan tailored to your nutritional targets.
            </p>
            
            <button 
              onClick={() => {
                const element = document.getElementById("scan-section");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="primary"
              style={{
                padding: "12px 28px",
                borderRadius: "20px",
                fontSize: "15px",
                fontWeight: 650,
                boxShadow: "0 4px 15px rgba(0, 102, 204, 0.25)"
              }}
            >
              Start Scanning ↓
            </button>
          </div>
        </section>

        {/* Dynamic Scan Interface Card */}
        <section id="scan-section" style={{ maxWidth: "760px", margin: "0 auto 80px" }}>
          <div className="ios-card" style={{ padding: "40px 30px", border: "1px solid rgba(0, 0, 0, 0.08)" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 750, letterSpacing: "-0.02em", textAlign: "center", marginBottom: "12px" }}>
              Try the Photo Scan Magic
            </h2>
            <p style={{ fontSize: "15px", color: "var(--apple-text-secondary)", textAlign: "center", marginBottom: "30px" }}>
              Experience scanning your fridge or grocery receipts. Drop an image or click below to see how it automatically extracts ingredients.
            </p>

            {/* Scanning Tabs */}
            <div style={{ 
              display: "inline-flex", 
              backgroundColor: "rgba(0, 0, 0, 0.05)", 
              padding: "3px", 
              borderRadius: "20px", 
              width: "100%", 
              marginBottom: "32px" 
            }}>
              <button 
                onClick={() => { setActiveTab("fridge"); setScanState("idle"); }}
                style={{ 
                  flex: 1, 
                  backgroundColor: activeTab === "fridge" ? "#FFFFFF" : "transparent",
                  color: "var(--apple-text-primary)",
                  boxShadow: activeTab === "fridge" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  borderRadius: "17px",
                  padding: "8px 12px",
                  fontSize: "14px"
                }}
              >
                📸 Fridge Photo Scanner
              </button>
              <button 
                onClick={() => { setActiveTab("receipt"); setScanState("idle"); }}
                style={{ 
                  flex: 1, 
                  backgroundColor: activeTab === "receipt" ? "#FFFFFF" : "transparent",
                  color: "var(--apple-text-primary)",
                  boxShadow: activeTab === "receipt" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  borderRadius: "17px",
                  padding: "8px 12px",
                  fontSize: "14px"
                }}
              >
                🧾 Grocery Receipt Scanner
              </button>
            </div>

            {/* Scan States Box */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: scanState === "dragging" ? "2px dashed var(--apple-blue)" : "2px dashed rgba(0,0,0,0.1)",
                backgroundColor: scanState === "dragging" ? "rgba(0,102,204,0.02)" : "rgba(0,0,0,0.01)",
                borderRadius: "var(--ios-radius-md)",
                padding: "48px 24px",
                textAlign: "center",
                cursor: scanState === "idle" ? "pointer" : "default",
                transition: "var(--ios-transition-fast)",
                position: "relative"
              }}
              onClick={scanState === "idle" ? triggerUpload : undefined}
            >
              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                accept="image/*" 
                onChange={handleFileChange}
              />

              {/* IDLE STATE */}
              {scanState === "idle" && (
                <div>
                  <div style={{ fontSize: "40px", marginBottom: "16px" }}>
                    {activeTab === "fridge" ? "🥦" : "🛒"}
                  </div>
                  <h3 style={{ fontSize: "19px", fontWeight: 650, color: "var(--apple-text-primary)", marginBottom: "8px" }}>
                    {activeTab === "fridge" 
                      ? "Drop a fridge photo here, or click to upload" 
                      : "Drop a grocery receipt photo, or click to upload"}
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--apple-text-muted)" }}>
                    Supports PNG, JPEG, or HEIC images up to 10MB
                  </p>
                </div>
              )}

              {/* DRAGGING STATE */}
              {scanState === "dragging" && (
                <div>
                  <div style={{ fontSize: "40px", marginBottom: "16px", transform: "scale(1.1)", transition: "var(--ios-transition-fast)" }}>
                    📥
                  </div>
                  <h3 style={{ fontSize: "19px", fontWeight: 650, color: "var(--apple-blue)", marginBottom: "8px" }}>
                    Drop to analyze instantly
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--apple-text-muted)" }}>
                    Release image file here to scan
                  </p>
                </div>
              )}

              {/* SCANNING / PROGRESS STATE */}
              {scanState === "scanning" && (
                <div className="animate-scan" style={{ padding: "12px 0" }}>
                  <div style={{ fontSize: "36px", marginBottom: "20px" }} className="animate-pulse-slow">
                    🧠
                  </div>
                  <h3 style={{ fontSize: "19px", fontWeight: 650, color: "var(--apple-text-primary)", marginBottom: "12px" }}>
                    {activeTab === "fridge" ? "Analyzing Fridge Photo..." : "Reading Receipt Details..."}
                  </h3>
                  <p style={{ fontSize: "14px", color: "var(--apple-text-muted)", marginBottom: "24px" }}>
                    {scanStep}
                  </p>
                  
                  {/* iOS Style Progress Bar */}
                  <div style={{ 
                    backgroundColor: "rgba(0,0,0,0.06)", 
                    height: "6px", 
                    borderRadius: "3px", 
                    width: "240px", 
                    margin: "0 auto", 
                    overflow: "hidden" 
                  }}>
                    <div style={{ 
                      backgroundColor: "var(--apple-blue)", 
                      height: "100%", 
                      width: `${scanProgress}%`, 
                      transition: "width 0.15s ease-out" 
                    }} />
                  </div>
                </div>
              )}

              {/* REVIEW INGREDIENTS STATE */}
              {scanState === "review" && (
                <div onClick={(e) => e.stopPropagation()} style={{ cursor: "default", textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div>
                      <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--apple-text-primary)" }}>
                        Ingredients Identified
                      </h3>
                      <p style={{ fontSize: "13px", color: "var(--apple-text-muted)" }}>
                        Confirm and adjust quantities extracted from your photo.
                      </p>
                    </div>
                    <button 
                      onClick={() => setScanState("idle")} 
                      className="secondary" 
                      style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "12px" }}
                    >
                      ↺ Scan New
                    </button>
                  </div>

                  {/* Ingredient Pills Container */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "28px" }}>
                    {ingredients.map((ing, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          backgroundColor: "var(--apple-bg-secondary)", 
                          border: "1px solid rgba(0, 0, 0, 0.06)",
                          padding: "6px 12px", 
                          borderRadius: "var(--ios-radius-capsule)",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "var(--apple-text-primary)",
                          boxShadow: "var(--ios-shadow-sm)"
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{ing.name}</span>
                        <span style={{ color: "var(--apple-text-muted)", fontSize: "13px" }}>({ing.quantity}g)</span>
                        
                        {/* Adjusters */}
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "4px" }}>
                          <button 
                            onClick={() => updateQty(idx, -50)} 
                            style={{ 
                              padding: 0, 
                              width: "20px", 
                              height: "20px", 
                              borderRadius: "50%", 
                              backgroundColor: "rgba(0,0,0,0.05)", 
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            -
                          </button>
                          <button 
                            onClick={() => updateQty(idx, 50)} 
                            style={{ 
                              padding: 0, 
                              width: "20px", 
                              height: "20px", 
                              borderRadius: "50%", 
                              backgroundColor: "rgba(0,0,0,0.05)", 
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            +
                          </button>
                          <button 
                            onClick={() => removeIngredient(idx)} 
                            style={{ 
                              padding: 0, 
                              width: "20px", 
                              height: "20px", 
                              borderRadius: "50%", 
                              backgroundColor: "rgba(255, 77, 77, 0.1)", 
                              color: "#ff4d4d", 
                              fontSize: "11px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginLeft: "2px"
                            }}
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    {ingredients.length === 0 && (
                      <p style={{ fontSize: "14px", color: "var(--apple-text-muted)" }}>No ingredients listed. Add some below!</p>
                    )}
                  </div>

                  {/* Add Ingredient In-Line Form */}
                  <form onSubmit={addIngredient} style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "30px", borderTop: "1px solid rgba(0, 0, 0, 0.05)", paddingTop: "20px" }}>
                    <input 
                      type="text" 
                      placeholder="Add custom ingredient (e.g. Salmon)" 
                      value={newIngredientName}
                      onChange={e => setNewIngredientName(e.target.value)}
                      style={{ flex: 2, padding: "8px 12px", fontSize: "14px", borderRadius: "10px", minWidth: "160px" }}
                    />
                    <input 
                      type="number" 
                      placeholder="Qty (g)" 
                      value={newIngredientQty}
                      onChange={e => setNewIngredientQty(e.target.value)}
                      style={{ width: "90px", padding: "8px 12px", fontSize: "14px", borderRadius: "10px" }}
                    />
                    <button 
                      type="submit" 
                      className="secondary" 
                      style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "14px", fontWeight: 600 }}
                    >
                      + Add
                    </button>
                  </form>

                  {/* Submit Generated Diet Button */}
                  <div style={{ textAlign: "center" }}>
                    <button 
                      onClick={handleGeneratePlan}
                      className="primary" 
                      style={{ 
                        padding: "14px 36px", 
                        borderRadius: "24px", 
                        fontSize: "16px", 
                        fontWeight: 700, 
                        boxShadow: "0 4px 15px rgba(0, 102, 204, 0.3)",
                        width: "100%",
                        maxWidth: "340px"
                      }}
                    >
                      🚀 Generate Diet Plan Now
                    </button>
                    {!userId && (
                      <p style={{ fontSize: "12px", color: "var(--apple-text-muted)", marginTop: "12px" }}>
                        Creates a private demo workspace automatically. No signup required.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section style={{ marginBottom: "80px" }}>
          <h2 style={{ 
            fontSize: "34px", 
            fontWeight: 800, 
            letterSpacing: "-0.03em", 
            textAlign: "center", 
            marginBottom: "48px",
            color: "var(--apple-text-primary)"
          }}>
            Why Mealbot is a game changer.
          </h2>

          {/* Cards Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
            gap: "30px" 
          }}>
            {/* Benefit Card 1 */}
            <div className="ios-card" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
              <img 
                src={zeroWasteImg} 
                alt="Zero Food Waste" 
                style={{ width: "100%", height: "200px", objectFit: "cover" }} 
              />
              <div style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px", color: "var(--apple-text-primary)" }}>
                  Zero Food Waste
                </h3>
                <p style={{ fontSize: "15px", lineHeight: 1.45, color: "var(--apple-text-secondary)" }}>
                  Stop throwing away expired groceries. Mealbot prioritizes ingredients nearing their expiration, turning what would be garbage into delicious meals.
                </p>
              </div>
            </div>

            {/* Benefit Card 2 */}
            <div className="ios-card" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
              <img 
                src={nutritionImg} 
                alt="Precise Macro Gating" 
                style={{ width: "100%", height: "200px", objectFit: "cover" }} 
              />
              <div style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px", color: "var(--apple-text-primary)" }}>
                  Personalized Nutrition
                </h3>
                <p style={{ fontSize: "15px", lineHeight: 1.45, color: "var(--apple-text-secondary)" }}>
                  Achieve your macro targets seamlessly. Mealbot balances proteins, fats, and carbs automatically while using the exact weights of ingredients in your fridge.
                </p>
              </div>
            </div>

            {/* Benefit Card 3 */}
            <div className="ios-card" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
              <img 
                src={chefImg} 
                alt="Chef-Level Recipes" 
                style={{ width: "100%", height: "200px", objectFit: "cover" }} 
              />
              <div style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px", color: "var(--apple-text-primary)" }}>
                  Chef-Quality Recipes
                </h3>
                <p style={{ fontSize: "15px", lineHeight: 1.45, color: "var(--apple-text-secondary)" }}>
                  No more boring chicken and rice. Get customized culinary instructions utilizing modern cooking science to guarantee delicious meals every single time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Auth Modal (iOS Style) */}
      {showAuthModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(5px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }} onClick={() => setShowAuthModal(false)}>
          <div className="ios-card" style={{ 
            width: "100%", 
            maxWidth: "400px", 
            padding: "32px", 
            position: "relative",
            margin: "0 16px"
          }} onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button 
              onClick={() => setShowAuthModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                fontSize: "18px",
                border: "none",
                cursor: "pointer",
                padding: "4px"
              }}
            >
              ✕
            </button>

            <h2 style={{ fontSize: "24px", fontWeight: 800, textAlign: "center", marginBottom: "8px" }}>
              {authMode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--apple-text-secondary)", textAlign: "center", marginBottom: "24px" }}>
              {authMode === "login" 
                ? "Enter credentials to load your diet workspace" 
                : "Sign up to track meals and save custom recipes"}
            </p>

            <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--apple-text-primary)" }}>Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@email.com" 
                  value={inputEmail}
                  onChange={e => setInputEmail(e.target.value)}
                  style={{ padding: "10px 14px", fontSize: "15px" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--apple-text-primary)" }}>Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  value={inputPassword}
                  onChange={e => setInputPassword(e.target.value)}
                  style={{ padding: "10px 14px", fontSize: "15px" }}
                />
              </div>

              {authError && (
                <p style={{ fontSize: "13px", color: "#ff4d4d", margin: 0, fontWeight: 500 }}>
                  ⚠️ {authError}
                </p>
              )}

              <button 
                type="submit" 
                className="primary" 
                disabled={authLoading}
                style={{ padding: "12px", borderRadius: "12px", fontWeight: 700, marginTop: "8px" }}
              >
                {authLoading ? "Authenticating..." : authMode === "login" ? "Sign In" : "Register"}
              </button>
            </form>

            <div style={{ marginTop: "24px", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "16px", textAlign: "center" }}>
              <button
                onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                style={{ background: "none", border: "none", fontSize: "13px", color: "var(--apple-blue)", fontWeight: 600 }}
              >
                {authMode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(0,0,0,0.05)", padding: "40px 24px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "var(--apple-text-muted)" }}>
          © {new Date().getFullYear()} Mealbot Inc. Crafted in Cupertino aesthetic. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
