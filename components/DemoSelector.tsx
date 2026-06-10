"use client";

import { useDemo } from "@/lib/demo-context";
import { FlaskConical, X, PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomCaseSimulatorModal } from "./CustomCaseSimulatorModal";

const CASES = [
  {
    id: "CASE-A",
    label: "Clean Approval",
    outcome: "Fast Track Approval",
    color: "text-sakan-success",
    dot: "bg-sakan-success",
  },
  {
    id: "CASE-B",
    label: "Salary Mismatch",
    outcome: "Additional Info Required",
    color: "text-sakan-warning",
    dot: "bg-sakan-warning",
  },
  {
    id: "CASE-C",
    label: "High Financial Stress",
    outcome: "Human Review Required",
    color: "text-sakan-danger",
    dot: "bg-sakan-danger",
  },
  {
    id: "CASE-D",
    label: "Duplicate / Policy Conflict",
    outcome: "Active Request Found → Direct Beneficiary Outcome",
    color: "text-sakan-danger",
    dot: "bg-sakan-danger",
  },
  {
    id: "CASE-E",
    label: "Income Loss / Vulnerability",
    outcome: "Humanitarian Review",
    color: "text-sakan-warning",
    dot: "bg-sakan-warning",
  },
];

export function DemoSelector() {
  // ── All hooks first (Rules of Hooks: never call after conditional return) ──
  const { selectedCaseId, setSelectedCaseId, language } = useDemo();
  const [hasMounted, setHasMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // ── Derived values ──
  const isAr = language === "AR";
  const active = CASES.find((c) => c.id === selectedCaseId);

  // ── Hydration-safe: neutral badge until client mount ──
  if (!hasMounted) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <button className="group flex items-center gap-2 bg-sakan-navy text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:bg-sakan-navy/90 transition-all border border-white/10 opacity-50">
          <FlaskConical className="w-4 h-4 text-sakan-gold" />
          <span className="text-xs font-semibold">Loading...</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-3 left-0 bg-white border border-sakan-border shadow-2xl rounded-2xl overflow-hidden w-80"
          >
            <div className="bg-sakan-navy px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-white font-semibold text-sm">Demo Scenario Control</div>
                <div className="text-white/50 text-xs mt-0.5">Choose a case to demonstrate different decision paths.</div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-2 max-h-[350px] overflow-y-auto">
              {CASES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCaseId(c.id); setIsOpen(false); }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedCaseId === c.id
                      ? "bg-sakan-navy text-white border-sakan-navy shadow-sm"
                      : "bg-sakan-bg/60 border-sakan-border text-sakan-navy hover:border-sakan-navy/40 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className={`w-2 h-2 rounded-full ${selectedCaseId === c.id ? "bg-sakan-gold" : c.dot}`} />
                    <span className="font-bold text-sm">{c.id}: {c.label}</span>
                  </div>
                  <div className={`text-xs pl-4 ${selectedCaseId === c.id ? "text-white/60" : "text-sakan-text/50"}`}>
                    → {c.outcome}
                  </div>
                </button>
              ))}

              <div className="border-t border-sakan-border/50 pt-2 mt-2">
                <button
                  onClick={() => {
                    setIsCustomOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full bg-sakan-gold text-sakan-navy p-3 rounded-xl font-bold text-xs hover:bg-sakan-gold/90 transition-all text-center flex items-center justify-center gap-2 shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {isAr ? "إنشاء حالة تجريبية مخصصة" : "Create Custom Demo Case"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 bg-sakan-navy text-white pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:bg-sakan-navy/90 transition-all border border-white/10"
      >
        <FlaskConical className="w-4 h-4 text-sakan-gold" />
        <span className="text-xs font-semibold">
          Demo: <span className="text-sakan-gold">{selectedCaseId.startsWith("CUSTOM") ? "CUSTOM" : selectedCaseId}</span>
        </span>
        <div className={`w-2 h-2 rounded-full ${active?.dot ?? "bg-sakan-gold"}`} />
      </button>

      <CustomCaseSimulatorModal
        isOpen={isCustomOpen}
        onClose={() => setIsCustomOpen(false)}
      />
    </div>
  );
}
