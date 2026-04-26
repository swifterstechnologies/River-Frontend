import { useState, useRef } from 'react';
import { transcribeAudio } from '../services/api';

export const useVoiceRecognition = ({ setInputText, setLoading, showToast }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProVoice, setIsProVoice] = useState(true);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const startStandardVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { 
      showToast('Voice recognition not supported in this browser.', 'error'); 
      return; 
    }
    if (recognitionRef.current) recognitionRef.current.stop();
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setInputText(prev => prev + " " + transcript);
    };
    try {
      recognition.start();
    } catch (err) {
      setIsRecording(false);
    }
  };

  const startProVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setLoading(true);
        try {
          const res = await transcribeAudio(audioBlob);
          const transcript = res.text || res.transcript; 
          if (transcript) {
            setInputText(prev => prev + " " + transcript);
          }
        } catch (err) {
          console.error("Pro Voice failed, falling back...", err);
          alert("Sarvam AI Error: " + (err.response?.data?.error || err.message));
        } finally {
          setLoading(false);
          setIsRecording(false);
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied:", err);
      startStandardVoice();
    }
  };

  const startVoiceInput = async () => {
    if (isProVoice) {
      startProVoice();
    } else {
      startStandardVoice();
    }
  };

  const stopVoiceInput = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  return { isRecording, startVoiceInput, stopVoiceInput, isProVoice, setIsProVoice };
};
