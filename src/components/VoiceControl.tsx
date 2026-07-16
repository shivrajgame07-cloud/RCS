import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRobotStore } from '../store/useRobotStore';
import { socket } from '../lib/socket';
import { parseVoiceCommand } from '../lib/voiceParser';

export default function VoiceControl() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [text, setText] = useState('');
  const transcriptRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const addLog = useRobotStore((s) => s.addLog);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
        transcriptRef.current = '';
        setText('');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcriptRef.current += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setText(transcriptRef.current + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
        if (event.error !== 'no-speech') {
          addLog(`VOICE ERROR: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcriptRef.current.trim()) {
          handleCommit(transcriptRef.current);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      addLog("Speech Recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
    } else {
      try {
        // Double check state if possible or just catch the 'already started' error
        recognitionRef.current.start();
      } catch (e: any) {
        if (e.name === 'InvalidStateError' || e.message.includes('already started')) {
          console.warn("Recognition already active, syncing state.");
          setIsListening(true);
        } else {
          console.error("Error starting recognition:", e);
          addLog("VOICE ERROR: Could not start microphone.");
        }
      }
    }
  };

  const handleCommit = (rawText: string) => {
    setIsProcessing(true);
    const steps = parseVoiceCommand(rawText);
    addLog(`VOICE: "${rawText}"`);
    
    // Simulate AI thinking for a moment for better UX
    setTimeout(() => {
      if (steps.length > 0) {
        socket.emit('voice_command', { raw: rawText, steps });
        addLog(`AI: Executing sequence (${steps.length} steps).`);
      } else {
        addLog(`AI: Command context unrecognized.`);
      }
      setIsProcessing(false);
      setText('');
      transcriptRef.current = '';
    }, 500);
  };

  return (
    <div className="flex flex-col h-full bg-black/20">
      <div className="flex-1 px-8 py-3 flex items-center gap-8">
        <div className="relative">
          <button 
            onClick={toggleListening}
            disabled={isProcessing}
            className={`w-14 h-14 rounded-full border-2 transition-all duration-300 flex items-center justify-center relative z-10
              ${isListening ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 
                isProcessing ? 'bg-purple-500/10 border-purple-400' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            ) : isListening ? (
              <Mic className="w-6 h-6 text-cyan-400" />
            ) : (
              <MicOff size={22} className="text-white/30" />
            )}
          </button>
          
          <AnimatePresence>
            {isListening && (
              <>
                <motion.div 
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-cyan-400/20 rounded-full z-0"
                />
                <motion.div 
                  initial={{ scale: 1, opacity: 0.3 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                  className="absolute inset-0 bg-cyan-400/10 rounded-full z-0"
                />
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-grow flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors
              ${isListening ? 'text-cyan-400' : isProcessing ? 'text-purple-400' : 'text-white/20'}`}>
              {isListening ? 'Streaming Audio' : isProcessing ? 'Analyzing Intent' : 'Neural Voice Interface'}
            </span>
            {isListening && <div className="flex gap-0.5">
              {[1, 2, 3].map(i => (
                <motion.div 
                  key={i}
                  animate={{ height: [2, 6, 2] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                  className="w-0.5 bg-cyan-400/60 rounded-full"
                />
              ))}
            </div>}
          </div>
          
          <div className="h-7 flex items-center">
            {text ? (
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm font-medium tracking-wide truncate max-w-[400px]
                  ${isListening ? 'text-white' : 'text-white/40 italic'}`}
              >
                {text}
              </motion.p>
            ) : (
              <span className="text-sm font-light text-white/10 tracking-widest italic">
                {isListening ? "Awaiting vocal instruction..." : "Tap mic to initiate command sequence"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 border-l border-white/5 pl-8">
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-white/20 font-mono uppercase">Engine Status</span>
            <span className="text-[10px] text-green-400 font-mono">READY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
