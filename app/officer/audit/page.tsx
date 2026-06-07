"use client";

import Link from "next/link";
import { MOCK_CASES } from "@/lib/mock-data";
import { runDecisionAgent } from "@/lib/agent-rules";
import { AuditTrailEvent } from "@/lib/types";
import { useDemo } from "@/lib/demo-context";
import { 
  ArrowLeft, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Download,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";

export default function AuditTrailPage() {
  const { selectedCaseId, customAuditLogs } = useDemo();
  const report = runDecisionAgent(MOCK_CASES[selectedCaseId]);
  
  // Extend audit trail slightly with dynamic context-logged actions
  const extendedTrail: AuditTrailEvent[] = [
    ...report.auditTrail,
    ...(customAuditLogs[selectedCaseId] || []),
    { timestamp: new Date(Date.now() - 5000).toISOString(), actor: "Officer", action: "Opened Decision Report", result: "Success" }
  ];

  return (
    <div className="min-h-screen bg-sakan-bg p-4 md:p-8 lg:p-12 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-sakan-border">
          <div className="flex items-center gap-4">
            <div className="bg-sakan-bg p-3 rounded-2xl border border-sakan-border">
              <History className="w-8 h-8 text-sakan-navy" />
            </div>
            <div>
              <Link href="/officer/workspace" className="text-sm font-medium text-sakan-text/50 hover:text-sakan-navy transition-colors mb-1 inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Workspace
              </Link>
              <h1 className="text-2xl font-bold text-sakan-navy">System Audit Trail</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-sakan-bg px-4 py-2 rounded-xl border border-sakan-border text-sm font-medium text-sakan-navy hover:bg-sakan-border/50 transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="flex items-center gap-2 bg-sakan-navy text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-sakan-navy/90 transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </header>

        <div className="bg-white rounded-3xl shadow-sm border border-sakan-border p-6 md:p-10">
          <div className="relative w-full max-w-sm mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sakan-text/40" />
            <input 
              type="text" 
              placeholder="Search logs..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-sakan-border bg-sakan-bg/50 text-sm focus:outline-none focus:ring-2 focus:ring-sakan-gold/50"
            />
          </div>

          <div className="relative border-l-2 border-sakan-border ml-3 space-y-8 pb-4">
            {extendedTrail.map((event, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative pl-8"
              >
                {/* Timeline Dot */}
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                  event.result === 'Success' ? 'bg-sakan-success' :
                  event.result === 'Warning' ? 'bg-sakan-warning' : 'bg-sakan-danger'
                }`} />

                <div className="bg-sakan-bg/50 border border-sakan-border rounded-xl p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <div className="font-semibold text-sakan-navy">{event.action}</div>
                    <div className="text-xs font-mono text-sakan-text/50 bg-white px-2 py-1 rounded border border-sakan-border">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-sakan-text/70">
                      <span className="font-medium text-sakan-navy">{event.actor}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {event.result === "Success" ? (
                        <span className="text-sakan-success flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Success</span>
                      ) : (
                        <span className="text-sakan-warning flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Warning</span>
                      )}
                    </div>
                    
                    {event.relatedReasonCode && (
                      <span className="bg-sakan-navy text-white px-2 py-0.5 rounded text-xs font-mono">
                        {event.relatedReasonCode}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
