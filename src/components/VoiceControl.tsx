import { Mic, MicOff, Send } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRobotStore } from '../store/useRobotStore';
import { socket } from '../lib/socket';
import { parseVoiceCommand } from '../lib/voiceParser';

export default function VoiceControl() {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState('');
  const addLog = useRobotStore((s) => s.addLog);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      addLog("Speech Recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
    };
    recognition.onend = () => {
      setIsListening(false);
      // Automatically send if non-empty
      if (text) handleCommit(text);
    };
    recognition.onerror = () => setIsListening(false);

    recognition.start();
  };

  const handleCommit = (rawText: string) => {
    if (!rawText.trim()) return;
    
    const steps = parseVoiceCommand(rawText);
    addLog(`VOICE: "${rawText}"`);
    
    if (steps.length > 0) {
      socket.emit('voice_command', { raw: rawText, steps });
      addLog(`AI: Parsed ${steps.length} command steps.`);
    } else {
      addLog(`AI: Could not understand command context.`);
    }
    
    setText('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-6 py-2 flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={toggleListening}
            className={`w-12 h-12 rounded-full border-2 transition-all duration-500 flex items-center justify-center 
              ${isListening ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'bg-white/5 border-white/10'}`}
          >
            {isListening ? (
              <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            ) : (
              <MicOff size={20} className="text-white/30" />
            )}
          </button>
          <AnimatePresence>
            {isListening && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 bg-cyan-400/30 rounded-full -z-10"
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex-grow">
          <div className="text-[10px] uppercase opacity-40 mb-1 font-bold tracking-widest">Voice Recognition</div>
          <div className="flex items-center gap-1.5 h-6">
            {isListening && [2, 4, 6, 3, 5, 2, 4].map((h, i) => (
              <motion.div 
                key={i}
                animate={{ height: [h*2, h*4, h*2] }}
                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                className="w-1 bg-cyan-400 rounded-full"
              />
            ))}
            {!isListening && <div className="w-[100px] h-[1px] bg-white/10" />}
            <input 
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommit(text)}
              placeholder={isListening ? "Listening..." : "Waiting for command..."}
              className="ml-4 bg-transparent border-none focus:outline-none text-white text-sm font-light tracking-wide w-full placeholder:text-white/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
