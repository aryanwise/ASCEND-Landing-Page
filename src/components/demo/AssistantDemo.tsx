'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  X,
  Cpu,
  Activity,
  Table,
  Mail,
  FileCheck,
  FileSearch,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────

interface Capability {
  id: string;
  title: string;
  description: string;
  example: string;
  icon: React.ReactNode;
  terminalLines: string[];
  successLine: string;
  previewType: 'email' | 'research' | 'pdf' | 'csv';
}

// ─── Data ──────────────────────────────────────────────

const CAPABILITIES: Capability[] = [
  {
    id: 'email',
    title: 'Draft & Send Emails',
    description: 'Just say: "Draft an email to team@example.com about our project update and send it." The agent writes it in your style, lets you review, and sends it directly.',
    example: 'Draft an email to partners@ascend.app summarizing our MVP progress, attach the research PDF, and send it.',
    icon: <Send size={18} strokeWidth={2} />,
    terminalLines: [
      '> Parsing intent: EMAIL_COMPOSITION',
      '> Loading style profile...',
      '> Drafting personalized overview...',
      '> Attaching mvp_overview.pdf (2.4 MB)',
      '> Running spam/phishing checks...',
      '> Delivering via secure client...',
      '> 250 OK Message accepted'
    ],
    successLine: 'Sent to partners@ascend.app',
    previewType: 'email'
  },
  {
    id: 'research',
    title: 'Quick Topic Research',
    description: 'Ask: "Research competitor pricing models for me." The agent searches top web sources, pulls the key facts, and writes a neat summary in seconds.',
    example: 'Research competitor pricing models and summarize the key differences in a table.',
    icon: <Search size={18} strokeWidth={2} />,
    terminalLines: [
      '> Query: competitor pricing analysis',
      '> Searching top 12 web sources...',
      '> Extracting pricing tiers...',
      '> Normalizing data formats...',
      '> Generating comparison table...',
      '> Compiling summary PDF...'
    ],
    successLine: 'Research PDF ready — 4 pages, 8 sources cited',
    previewType: 'research'
  },
  {
    id: 'pdf',
    title: 'Create Clean PDFs',
    description: 'Tell the agent: "Convert my weekly notes into a PDF guide." It automatically packages your text and research into a beautifully formatted local PDF file.',
    example: 'Convert my weekly notes into a clean PDF guide with headers and a cover page.',
    icon: <FileText size={18} strokeWidth={2} />,
    terminalLines: [
      '> Loading weekly_notes.md...',
      '> Parsing markdown structure...',
      '> Generating cover page...',
      '> Applying typography styles...',
      '> Embedding linked assets...',
      '> Exporting to local PDF...'
    ],
    successLine: 'weekly_guide.pdf saved to ~/Downloads',
    previewType: 'pdf'
  },
  {
    id: 'boring',
    title: 'Do the Boring Work',
    description: 'Outsource repetitive tasks like "Format this list into a clean table" or "Write a template for follow-up texts." The agent executes it instantly in the background.',
    example: 'Format this messy contact list into a clean CSV and generate follow-up email templates.',
    icon: <ShieldCheck size={18} strokeWidth={2} />,
    terminalLines: [
      '> Parsing unstructured list...',
      '> Normalizing 47 contact records...',
      '> Validating email formats...',
      '> Generating CSV output...',
      '> Writing 3 follow-up templates...',
      '> Packaging deliverables...'
    ],
    successLine: 'contacts.csv + 3 templates ready',
    previewType: 'csv'
  }
];

// ─── Artifact Preview Component ────────────────────────

function ArtifactPreview({ type }: { type: Capability['previewType'] }) {
  return (
    <div style={{
      marginTop: 12,
      background: '#1E1E1E',
      borderRadius: 8,
      border: '1px solid #333',
      padding: '10px',
      animation: 'expandIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{ fontSize: 9, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Output Preview
      </div>
      
      {type === 'email' && (
        <div style={{ background: '#252525', borderRadius: 6, padding: '8px', border: '1px solid #2D2D2D' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #333', paddingBottom: 6, marginBottom: 6 }}>
            <Mail size={12} color="#9ca3af" />
            <div style={{ fontSize: 9, color: '#d1d5db' }}><span style={{ color: '#888' }}>To:</span> partners@ascend.app</div>
          </div>
          <div style={{ fontSize: 9, color: '#d1d5db', marginBottom: 6 }}><span style={{ color: '#888' }}>Subj:</span> MVP Progress & Overview</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ height: 4, background: '#333', width: '80%', borderRadius: 2 }} />
            <div style={{ height: 4, background: '#333', width: '100%', borderRadius: 2 }} />
            <div style={{ height: 4, background: '#333', width: '60%', borderRadius: 2 }} />
          </div>
        </div>
      )}

      {type === 'research' && (
        <div style={{ background: '#252525', borderRadius: 6, padding: '8px', border: '1px solid #2D2D2D', display: 'flex', gap: 8 }}>
          <div style={{ flexShrink: 0 }}>
            <FileSearch size={18} color="#60a5fa" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: '#d1d5db', fontWeight: 600, marginBottom: 4 }}>Competitor_Pricing_Analysis.pdf</div>
            <div style={{ fontSize: 8, color: '#888' }}>4 Pages • Generated from 8 sources</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <span style={{ padding: '2px 4px', background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', borderRadius: 3, fontSize: 7 }}>Pricing Tiers</span>
              <span style={{ padding: '2px 4px', background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', borderRadius: 3, fontSize: 7 }}>Feature Matrix</span>
            </div>
          </div>
        </div>
      )}

      {type === 'pdf' && (
        <div style={{ background: '#252525', borderRadius: 6, padding: '8px', border: '1px solid #2D2D2D', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 36, background: '#fff', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCheck size={14} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#d1d5db', fontWeight: 600 }}>weekly_guide.pdf</div>
            <div style={{ fontSize: 8, color: '#10b981', marginTop: 2 }}>Export successful • 1.2 MB</div>
          </div>
        </div>
      )}

      {type === 'csv' && (
        <div style={{ background: '#252525', borderRadius: 6, padding: '8px', border: '1px solid #2D2D2D' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Table size={12} color="#34d399" />
            <div style={{ fontSize: 9, color: '#d1d5db', fontWeight: 600 }}>contacts_cleaned.csv</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 4 }}>
            {['Name', 'Email', 'Status'].map(h => (
              <div key={h} style={{ fontSize: 7, color: '#888', background: '#1a1a1a', padding: '3px 4px', borderRadius: 2 }}>{h}</div>
            ))}
            <div style={{ height: 6, background: '#333', borderRadius: 2 }} />
            <div style={{ height: 6, background: '#333', borderRadius: 2 }} />
            <div style={{ height: 6, background: 'rgba(16, 185, 129, 0.2)', borderRadius: 2 }} />
            <div style={{ height: 6, background: '#333', borderRadius: 2 }} />
            <div style={{ height: 6, background: '#333', borderRadius: 2 }} />
            <div style={{ height: 6, background: 'rgba(16, 185, 129, 0.2)', borderRadius: 2 }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Terminal Component ────────────────────────────────

function MiniTerminal({ example, lines, activeIndex, status, successLine, previewType }: {
  example: string;
  lines: string[];
  activeIndex: number;
  status: 'idle' | 'running' | 'done';
  successLine: string;
  previewType: Capability['previewType'];
}) {
  const [metrics, setMetrics] = useState({ tps: 42.5, mem: 1.2, lat: 14 });

  // Simulate live telemetry while running
  useEffect(() => {
    if (status !== 'running') return;
    const interval = setInterval(() => {
      setMetrics({
        tps: +(40 + Math.random() * 8).toFixed(1),
        mem: +(1.2 + Math.random() * 0.1).toFixed(2),
        lat: Math.floor(12 + Math.random() * 6)
      });
    }, 400);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div style={{
      width: '100%',
      background: '#121212',
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid #2D2D2D',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 10,
      boxShadow: '0 8px 30px -8px rgba(0,0,0,0.3)'
    }}>
      {/* Header with Dynamic Metrics */}
      <div style={{
        background: '#1E1E1E',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #2D2D2D'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c93f' }} />
          </div>
          <span style={{ marginLeft: 6, fontSize: 9, color: '#888', fontWeight: 600 }}>AscendOS</span>
        </div>
        
        {/* Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: status === 'running' ? '#60a5fa' : '#6b7280', transition: 'color 0.3s' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8 }}><Cpu size={10} /> {status === 'idle' ? '0.0' : metrics.tps} t/s</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8 }}><Activity size={10} /> {status === 'idle' ? '0.00' : metrics.mem}GB</span>
          <span style={{ fontSize: 8 }}>{status === 'idle' ? '--' : `${metrics.lat}ms`}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 12px' }}>
        <div style={{ 
          color: '#10b981', 
          fontSize: 9, 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em', 
          fontWeight: 700,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <span>›</span> Input Delegation:
        </div>
        
        {/* ACTUAL USER PROMPT */}
        <div style={{ background: '#1E1E1E', borderRadius: 6, padding: '8px 10px', marginBottom: 12, border: '1px solid #2D2D2D' }}>
          <p style={{ color: '#e5e7eb', lineHeight: 1.5, margin: 0, fontSize: 10 }}>
            "{example}"
          </p>
        </div>

        {/* Execution Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {lines.map((line, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 5,
              opacity: idx <= activeIndex ? 1 : 0.2,
              transition: 'opacity 0.3s ease',
              color: idx === activeIndex && status === 'running' ? '#10b981' : idx < activeIndex ? '#9ca3af' : '#4b5563'
            }}>
              <span style={{ marginTop: 1, flexShrink: 0, width: 12, display: 'flex', justifyContent: 'center' }}>
                {idx < activeIndex ? (
                  <CheckCircle2 size={10} color="#10b981" />
                ) : idx === activeIndex && status === 'running' ? (
                  <Loader2 size={10} color="#10b981" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <span style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #4b5563', marginTop: 1 }} />
                )}
              </span>
              <span style={{ fontSize: 10, lineHeight: 1.4 }}>{line}</span>
            </div>
          ))}
        </div>

        {/* Success Output & Preview Artifact */}
        {status === 'done' && (
          <>
            <ArtifactPreview type={previewType} />
            <div style={{
              marginTop: 12,
              paddingTop: 8,
              borderTop: '1px solid #2D2D2D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981', fontSize: 10 }}>
                <CheckCircle2 size={12} /> {successLine}
              </div>
              <button style={{
                background: 'transparent',
                border: '1px solid #333',
                color: '#e5e7eb',
                fontSize: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '4px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#333'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Open File
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Demo Component ───────────────────────────────

export default function AssistantDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  const [terminalLine, setTerminalLine] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runSimulation = (id: string) => {
    if (selected === id && status === 'done') {
      setSelected(null);
      setStatus('idle');
      return;
    }
    if (selected === id && status === 'running') return;
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    setSelected(id);
    setTerminalLine(0);
    setStatus('running');

    const cap = CAPABILITIES.find(c => c.id === id)!;
    let lineIdx = 0;

    intervalRef.current = setInterval(() => {
      if (lineIdx >= cap.terminalLines.length - 1) {
        clearInterval(intervalRef.current!);
        setStatus('done');
        setCompletedIds(prev => new Set(prev).add(id));
        return;
      }
      lineIdx++;
      setTerminalLine(lineIdx);
    }, 350);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSelected(null);
    setTerminalLine(0);
    setStatus('idle');
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div style={{ 
      background: '#FAF8F5', 
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '32px 20px 24px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 20,
            background: '#E8F5E9',
            color: '#2E7D32',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 16,
            border: '1px solid #C8E6C9'
          }}>
            <Sparkles size={12} /> Background Execution Engine
          </span>
          
          <h2 style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 32,
            fontWeight: 700,
            color: '#1A1815',
            margin: '0 0 10px 0',
            letterSpacing: '-0.02em',
            lineHeight: 1.1
          }}>
            Delegate Your Daily Priorities
          </h2>
          
          <p style={{
            fontSize: 14,
            color: '#6B6359',
            maxWidth: 320,
            margin: '0 auto',
            lineHeight: 1.55
          }}>
            Don't let busywork slow your momentum. Tap any card to see how Ascend handles it.
          </p>
        </div>

        {/* Cards Stack */}
        <div style={{
          padding: '0 16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          {CAPABILITIES.map((cap) => {
            const isSelected = selected === cap.id;
            const isDone = completedIds.has(cap.id);
            const isRunning = isSelected && status === 'running';

            return (
              <div
                key={cap.id}
                onClick={() => runSimulation(cap.id)}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  border: isSelected ? '1.5px solid #D9531E' : '1px solid rgba(26,24,21,0.06)',
                  padding: isSelected ? '16px' : '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: isSelected 
                    ? '0 4px 20px rgba(217,83,30,0.08)' 
                    : '0 1px 3px rgba(0,0,0,0.03)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background: isSelected || isDone ? '#FEF0E8' : '#F5F3EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected || isDone ? '#D9531E' : '#6B6359',
                    flexShrink: 0,
                    transition: 'all 0.25s ease',
                    border: isDone && !isSelected ? '1.5px solid #2E7D32' : '1.5px solid transparent'
                  }}>
                    {isDone && !isSelected ? <CheckCircle2 size={18} color="#2E7D32" /> : cap.icon}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 3,
                      flexWrap: 'wrap'
                    }}>
                      <h3 style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#1A1815',
                        margin: 0
                      }}>
                        {cap.title}
                      </h3>
                      {isDone && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#2E7D32',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3
                        }}>
                          <CheckCircle2 size={12} /> Done
                        </span>
                      )}
                      {isRunning && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#D9531E',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3
                        }}>
                          <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> Running
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: 12,
                      color: '#6B6359',
                      lineHeight: 1.5,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: isSelected ? 'unset' : 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {cap.description}
                    </p>
                  </div>
                </div>

                {/* Expanded Content — ONLY TERMINAL */}
                {isSelected && (
                  <div style={{ 
                    marginTop: 16,
                    animation: 'expandIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
                  }}>
                    <MiniTerminal
                      example={cap.example}
                      lines={cap.terminalLines}
                      activeIndex={terminalLine}
                      status={status}
                      successLine={cap.successLine}
                      previewType={cap.previewType}
                    />

                    {/* Footer */}
                    <div style={{
                      marginTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      {status === 'done' ? (
                        <span style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#2E7D32',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}>
                          <CheckCircle2 size={14} /> Saved you 12 minutes
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#A8A095' }}>
                          Running securely on-device...
                        </span>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reset();
                        }}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 8,
                          border: '1px solid rgba(26,24,21,0.1)',
                          background: '#fff',
                          fontSize: 11,
                          color: '#6B6359',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3
                        }}
                      >
                        <X size={12} /> Close
                      </button>
                    </div>
                  </div>
                )}

                {/* Running indicator bar */}
                {isRunning && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: '#F5F3EE'
                  }}>
                    <div style={{
                      height: '100%',
                      background: '#D9531E',
                      borderRadius: 2,
                      animation: 'shimmer 1.2s ease-in-out infinite',
                      width: '60%'
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', padding: '8px 20px 40px' }}>
          <a href="/#waitlist" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '12px 24px',
              background: '#1A1815',
              color: '#fff',
              borderRadius: 12,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 20px rgba(26,24,21,0.2)'
            }}>
              Get Early Access <Sparkles size={14} />
            </button>
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes expandIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}