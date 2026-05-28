'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { MobileHeader, MobileBottomNav } from '@/components/MobileNav';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Assignment, GeneratedPaper, Section, Question } from '@/types';
import toast from 'react-hot-toast';

export default function AssignmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { currentAssignment, fetchAssignment, regenerateAssignment } = useAssignmentStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);

  useWebSocket(id);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchAssignment(id);
      setIsLoading(false);
    })();
  }, [id]);

  // Poll while processing
  useEffect(() => {
    if (!currentAssignment || currentAssignment.status !== 'processing') return;
    const timer = setInterval(() => fetchAssignment(id), 4000);
    return () => clearInterval(timer);
  }, [currentAssignment?.status, id]);

  const handleRegenerate = async () => {
    await regenerateAssignment(id);
    toast.success('Regenerating question paper...');
  };

  const handleDownloadPDF = async () => {
    if (!paperRef.current) return;
    setIsDownloading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      
      // Clone the paper element and apply desktop A4 styles off-screen
      const originalElement = paperRef.current;
      const clone = originalElement.cloneNode(true) as HTMLDivElement;
      
      // Standardize size to exact desktop A4 container
      clone.style.width = '800px';
      clone.style.maxWidth = 'none';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '-9999px';
      clone.style.padding = '40px';
      clone.style.background = 'white';
      clone.style.boxSizing = 'border-box';
      
      // Copy over the values from the interactive input fields into the clone so they render in the PDF
      const originalInputs = originalElement.querySelectorAll('input');
      const clonedInputs = clone.querySelectorAll('input');
      originalInputs.forEach((input, index) => {
        if (clonedInputs[index]) {
          // Replace input elements with span elements for a perfect paper print look
          const span = document.createElement('span');
          span.style.borderBottom = '1px solid #333';
          span.style.display = 'inline-block';
          span.style.minWidth = input.style.width || '100px';
          span.style.fontFamily = "'Times New Roman', serif";
          span.style.fontSize = '13px';
          span.style.paddingBottom = '2px';
          span.innerHTML = input.value ? `&nbsp;${input.value}&nbsp;` : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
          
          if (input.parentNode) {
            input.parentNode.replaceChild(span, input);
          }
        }
      });

      document.body.appendChild(clone);
      
      const canvas = await html2canvas(clone, { scale: 2, useCORS: true });
      document.body.removeChild(clone);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let y = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let page = 0;
      while (y < pdfHeight) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -y, pdfWidth, pdfHeight);
        y += pageHeight;
        page++;
      }
      pdf.save(`${currentAssignment?.title || 'assignment'}.pdf`);
      toast.success('PDF downloaded!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div className="main-layout">
          <Topbar backHref="/assignments" breadcrumb="Assignment" />
          <MobileHeader title="Assignment" backHref="/assignments" />
          <div className="content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #e0e0e0', borderTopColor: '#E84A2F', borderRadius: '50%', margin: '0 auto 16px' }} className="animate-spin" />
              <p style={{ color: '#666' }}>Loading assignment...</p>
            </div>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  if (!currentAssignment) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div className="main-layout">
          <Topbar backHref="/assignments" />
          <MobileHeader title="Assignment" backHref="/assignments" />
          <div className="content-area">
            <p>Assignment not found.</p>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  const { status, generatedPaper, error } = currentAssignment;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="main-layout">
        <Topbar backHref="/assignments" breadcrumb="Assignment" />
        <MobileHeader title="Assignment" backHref="/assignments" />
        <div className="content-area">
          {/* Action bar */}
          <div className="action-bar">
            <div className="action-bar-text">
              <p>
                {status === 'processing'
                  ? '✨ Generating your question paper... This may take a moment.'
                  : status === 'completed'
                  ? `✨ Here is your customized Question Paper for ${generatedPaper?.className || ''} ${generatedPaper?.subject || ''} class:`
                  : status === 'failed'
                  ? '❌ Generation failed. Please try regenerating.'
                  : 'Processing...'}
              </p>
            </div>
            
            {status === 'completed' && (
              <div className="action-bar-buttons">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="btn-download"
                  style={{ gap: 6 }}
                >
                  {isDownloading ? (
                    <span className="animate-spin" style={{ width: 14, height: 14, border: '2px solid #ccc', borderTopColor: '#333', borderRadius: '50%', display: 'inline-block' }} />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  )}
                  Download PDF
                </button>
                
                <button
                  onClick={handleRegenerate}
                  className="btn-regenerate"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                  </svg>
                  Regenerate
                </button>
              </div>
            )}
          </div>

          {/* Processing state */}
          {status === 'processing' && (
            <div style={{
              background: 'white', borderRadius: 12, padding: 40,
              textAlign: 'center', border: '1px solid #e8e8e8'
            }}>
              <div style={{ width: 48, height: 48, border: '3px solid #f0f0f0', borderTopColor: '#E84A2F', borderRadius: '50%', margin: '0 auto 20px' }} className="animate-spin" />
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Generating Your Question Paper</h3>
              <p style={{ color: '#666', fontSize: 14, maxWidth: 400, margin: '0 auto 20px' }}>
                Our AI is crafting a customized question paper based on your specifications. This usually takes 15–30 seconds.
              </p>
              <div className="progress-bar" style={{ maxWidth: 300, margin: '0 auto' }}>
                <div className="progress-fill animate-pulse" style={{ width: '70%' }} />
              </div>
            </div>
          )}

          {/* Failed state */}
          {status === 'failed' && (
            <div style={{
              background: 'white', borderRadius: 12, padding: 40,
              textAlign: 'center', border: '1px solid #fce4ec'
            }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>❌</p>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Generation Failed</h3>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>{error || 'Something went wrong. Please try again.'}</p>
              <button className="btn-primary" onClick={handleRegenerate}>Try Again</button>
            </div>
          )}

          {/* Generated paper */}
          {status === 'completed' && generatedPaper && (
            <div 
              ref={paperRef} 
              className="paper-container" 
              style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 16,
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                background: 'white'
              }}
            >
              <PaperOutput 
                paper={generatedPaper} 
                showAnswers={showAnswers} 
                setShowAnswers={setShowAnswers} 
              />
            </div>
          )}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}

function PaperOutput({ 
  paper, 
  showAnswers, 
  setShowAnswers 
}: { 
  paper: GeneratedPaper; 
  showAnswers: boolean; 
  setShowAnswers: (show: boolean) => void;
}) {
  return (
    <div style={{ fontFamily: "'Times New Roman', serif" }}>
      {/* School Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: 16, marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{paper.schoolName}</h1>
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Subject: {paper.subject}</p>
        <p style={{ fontSize: 15, fontWeight: 600 }}>Class: {paper.className}</p>
      </div>

      {/* Meta Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 13, fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
        <span>Time Allowed: {paper.timeAllowed}</span>
        <span>Maximum Marks: {paper.maxMarks}</span>
      </div>

      {/* General Instructions */}
      <p style={{ fontSize: 12, marginBottom: 20, fontStyle: 'italic', color: '#444' }}>
        <strong>General Instructions:</strong> All questions are compulsory. Marks are indicated against each question. Maintain neatness.
      </p>

      {/* Student Info (Interactive inputs) */}
      <div style={{ 
        marginBottom: 28, 
        fontSize: 13, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 10,
        background: '#fafafa',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, color: '#555' }}>Student Name:</span>
          <input 
            type="text" 
            placeholder="Write Name here..." 
            className="student-info-input"
            style={{
              border: 'none',
              borderBottom: '1px solid #999',
              background: 'transparent',
              outline: 'none',
              width: '280px',
              fontSize: '13px',
              paddingBottom: '2px',
              fontFamily: "'Times New Roman', serif"
            }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#555' }}>Roll Number:</span>
            <input 
              type="text" 
              placeholder="Write Roll No..." 
              className="student-info-input"
              style={{
                border: 'none',
                borderBottom: '1px solid #999',
                background: 'transparent',
                outline: 'none',
                width: '160px',
                fontSize: '13px',
                paddingBottom: '2px',
                fontFamily: "'Times New Roman', serif"
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, color: '#555' }}>Section:</span>
            <input 
              type="text" 
              placeholder="e.g. A" 
              className="student-info-input"
              style={{
                border: 'none',
                borderBottom: '1px solid #999',
                background: 'transparent',
                outline: 'none',
                width: '80px',
                fontSize: '13px',
                paddingBottom: '2px',
                textAlign: 'center',
                fontFamily: "'Times New Roman', serif"
              }}
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      {paper.sections.map((section, si) => (
        <SectionBlock key={si} section={section} />
      ))}

      {/* Answer Key Toggle Component */}
      {paper.answerKey && paper.answerKey.length > 0 && (
        <div 
          style={{ 
            marginTop: 36, 
            paddingTop: 24, 
            borderTop: '2px dashed #999'
          }}
          className="answer-key-section"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#4CAF50' }} />
              Answer Key &amp; Reference Solutions
            </h2>
            
            <button 
              onClick={() => setShowAnswers(!showAnswers)}
              className="btn-outline"
              style={{ 
                fontSize: '12px', 
                padding: '6px 14px', 
                borderRadius: '16px',
                background: showAnswers ? '#f0f0f0' : 'white',
                cursor: 'pointer',
                fontWeight: 600,
                border: '1px solid #ccc',
                fontFamily: "var(--font-sans, sans-serif)",
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {showAnswers ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  Hide Solutions
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Reveal Solutions
                </>
              )}
            </button>
          </div>
          
          {showAnswers ? (
            <div style={{ 
              background: '#fcfcfc', 
              border: '1px solid #eef0f2', 
              borderRadius: '8px', 
              padding: '16px 20px' 
            }}>
              <ol style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
                {paper.answerKey.map((ans, i) => (
                  <li key={i} style={{ marginBottom: 8, color: '#333' }}>
                    <strong style={{ marginRight: 4 }}>Q{i+1}:</strong> {ans.replace(/^\d+\.\s*/, '')}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div style={{ 
              background: '#fafafa', 
              border: '1px dashed #ddd', 
              borderRadius: '8px', 
              padding: '20px', 
              textAlign: 'center',
              color: '#888',
              fontSize: '13px'
            }}>
              Click "Reveal Solutions" above to view or print the model answer key.
            </div>
          )}
        </div>
      )}

      <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '1px', color: '#555', textTransform: 'uppercase' }}>
        *** End of Question Paper ***
      </p>
    </div>
  );
}

function SectionBlock({ section }: { section: Section }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 16, 
        borderBottom: '1px solid #333', 
        paddingBottom: 4 
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, display: 'inline-block', margin: 0, textTransform: 'uppercase' }}>
          {section.title}
        </h2>
      </div>
      <p style={{ fontSize: 12, fontStyle: 'italic', textAlign: 'center', color: '#555', marginBottom: 16 }}>
        {section.instruction}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {section.questions.map((q) => (
          <QuestionItem key={q.questionNumber} question={q} />
        ))}
      </div>
    </div>
  );
}

function QuestionItem({ question }: { question: Question }) {
  const getDiffClass = (diff: string) => {
    const d = diff.toLowerCase();
    if (d === 'easy') return 'diff-easy';
    if (d === 'hard') return 'diff-hard';
    return 'diff-moderate';
  };

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.6 }}>
      <span style={{ fontWeight: 600, minWidth: 24 }}>{question.questionNumber}.</span>
      <div style={{ flex: 1 }}>
        <span 
          className={`status-badge ${getDiffClass(question.difficulty)}`} 
          style={{ 
            marginRight: 10, 
            fontSize: '9px', 
            padding: '2px 8px', 
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.5px',
            fontFamily: "var(--font-sans, sans-serif)",
            verticalAlign: 'middle',
            display: 'inline-block',
            lineHeight: 1.2
          }}
        >
          {question.difficulty}
        </span>
        <span style={{ color: '#111' }}>{question.text}</span>
      </div>
      <span style={{ 
        fontWeight: 700, 
        whiteSpace: 'nowrap', 
        fontSize: '12px', 
        color: '#333',
        marginLeft: 16
      }}>
        [{question.marks} Mark{question.marks !== 1 ? 's' : ''}]
      </span>
    </div>
  );
}
