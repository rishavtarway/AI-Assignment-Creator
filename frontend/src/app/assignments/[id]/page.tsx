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

  const { status, generatedPaper, error, title } = currentAssignment;

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
                >
                  {isDownloading ? (
                    <span className="animate-spin" style={{ width: 14, height: 14, border: '2px solid #ccc', borderTopColor: '#333', borderRadius: '50%', display: 'inline-block' }} />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  )}
                  Download as PDF
                </button>
                
                <button
                  onClick={handleRegenerate}
                  className="btn-regenerate"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div ref={paperRef} className="paper-container" style={{ border: '2px solid #e8c84a', borderRadius: 8 }}>
              <PaperOutput paper={generatedPaper} />
            </div>
          )}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}

function PaperOutput({ paper }: { paper: GeneratedPaper }) {
  return (
    <div style={{ fontFamily: "'Times New Roman', serif" }}>
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: 16, marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{paper.schoolName}</h1>
        <p style={{ fontSize: 15, marginBottom: 2 }}>Subject: {paper.subject}</p>
        <p style={{ fontSize: 15 }}>Class: {paper.className}</p>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 13 }}>
        <span>Time Allowed: {paper.timeAllowed}</span>
        <span>Maximum Marks: {paper.maxMarks}</span>
      </div>

      <p style={{ fontSize: 13, marginBottom: 16, fontStyle: 'italic' }}>
        All questions are compulsory unless stated otherwise.
      </p>

      {/* Student Info */}
      <div style={{ marginBottom: 24, fontSize: 13 }}>
        <div style={{ marginBottom: 8 }}>Name: <span style={{ borderBottom: '1px solid #333', display: 'inline-block', width: 180 }}>&nbsp;</span></div>
        <div style={{ marginBottom: 8 }}>Roll Number: <span style={{ borderBottom: '1px solid #333', display: 'inline-block', width: 160 }}>&nbsp;</span></div>
        <div>Class: <span style={{ borderBottom: '1px solid #333', display: 'inline-block', width: 60 }}>&nbsp;</span>&nbsp;&nbsp;Section: <span style={{ borderBottom: '1px solid #333', display: 'inline-block', width: 60 }}>&nbsp;</span></div>
      </div>

      {/* Sections */}
      {paper.sections.map((section, si) => (
        <SectionBlock key={si} section={section} />
      ))}

      {/* Answer Key */}
      {paper.answerKey && paper.answerKey.length > 0 && (
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '2px solid #333' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Answer Key:</h2>
          <ol style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
            {paper.answerKey.map((ans, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {ans.replace(/^\d+\.\s*/, '')}
              </li>
            ))}
          </ol>
        </div>
      )}

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>End of Question Paper</p>
    </div>
  );
}

function SectionBlock({ section }: { section: Section }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>
        {section.title}
      </h2>
      <p style={{ fontSize: 12, fontStyle: 'italic', textAlign: 'center', color: '#555', marginBottom: 14 }}>
        {section.instruction}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {section.questions.map((q) => (
          <QuestionItem key={q.questionNumber} question={q} />
        ))}
      </div>
    </div>
  );
}

function QuestionItem({ question }: { question: Question }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14 }}>
      <span style={{ fontWeight: 600, minWidth: 24 }}>{question.questionNumber}.</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontStyle: 'italic', marginRight: 8 }}>[{question.difficulty}]</span>
        <span>{question.text}</span>
      </div>
      <span style={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: 13 }}>[{question.marks} Mark{question.marks !== 1 ? 's' : ''}]</span>
    </div>
  );
}
