import React, { useState, useEffect, useCallback, useRef } from 'react';
const IntegratedQuizApp = () => {
  // Configuration - Update these URLs to match your backend
  const API_BASE_URL = 'http://localhost:3001'; // Change this to your backend URL
  
  // Global state for quiz sessions and results
  const [quizSessions, setQuizSessions] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // App state
  const [currentView, setCurrentView] = useState('home'); // 'home', 'admin', 'student'
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  // Admin states
  const [adminCode, setAdminCode] = useState('');
  const [activeAdminSection, setActiveAdminSection] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState('');
  const [resultSessionCode, setResultSessionCode] = useState('');
  const [resultFilter, setResultFilter] = useState('all');
// ADD these new CSV states:
const [entryMethod, setEntryMethod] = useState('manual'); // 'manual' or 'csv'
const [csvFile, setCsvFile] = useState(null);
const [csvPreview, setCsvPreview] = useState([]);
const [showCsvPreview, setShowCsvPreview] = useState(false);
const [csvErrors, setCsvErrors] = useState([]);

  
  // Student states
  const [studentView, setStudentView] = useState('codeEntry'); // 'codeEntry', 'form', 'quiz', 'result'
  const [quizCode, setQuizCode] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    regNo: '',
    department: ''
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [showWarning, setShowWarning] = useState(false);
  // NEW: Track tab switches
  const [tabSwitchCount, setTabSwitchCount] = useState(0); 
  const [warningMessage, setWarningMessage] = useState('');


// ENHANCED: Quiz violations and resume states (ADD THESE)
const [quizViolations, setQuizViolations] = useState([]);
const [violationSessionCode, setViolationSessionCode] = useState('');
const [selectedViolation, setSelectedViolation] = useState(null);
const [showViolationDetails, setShowViolationDetails] = useState(false);

// Student resume states (no token)
const [isResuming, setIsResuming] = useState(false);
const [suspensionMessage, setSuspensionMessage] = useState('');
const [violationId, setViolationId] = useState(null);
const [originalTimeAllotted, setOriginalTimeAllotted] = useState(90 * 60);
const [timeSpent, setTimeSpent] = useState(0);

// Add these new state variables:
const [userEmail, setUserEmail] = useState('');
const [userPassword, setUserPassword] = useState('');
const [userRole, setUserRole] = useState('');
const [currentUser, setCurrentUser] = useState(null);
const [violationCount, setViolationCount] = useState(0);

const [registrationError, setRegistrationError] = useState('');
// Registration states
const [showRegistration, setShowRegistration] = useState(false);
const [registrationData, setRegistrationData] = useState({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
});
const [predictedRole, setPredictedRole] = useState('');


// Comprehension passage states
const [passageText, setPassageText] = useState('');
const [passageTitle, setPassageTitle] = useState('');
const [passages, setPassages] = useState([]);
const [showPassageModal, setShowPassageModal] = useState(false);
// Audio states
const [audioFile, setAudioFile] = useState(null);
const [audioUrl, setAudioUrl] = useState('');
const [isAudioPlaying, setIsAudioPlaying] = useState(false);
const audioRef = useRef(null);
const [showAudioUpload, setShowAudioUpload] = useState(false);
const [selectedPassage, setSelectedPassage] = useState(null);

  // NEW: CSV Export Function
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export!');
      return;
    }

    // Define CSV headers
    const headers = [
      'Student Name',
      'Registration Number',
      'Department',
      'Score',
      'Total Questions',
      'Percentage',
      'Grade',
      'Submission Date',
      'Submission Time'
    ];

    // Convert data to CSV format
    const csvContent = [
      headers.join(','),
      ...data.map(result => {
        const submissionDate = new Date(result.submittedAt);
        const grade = getGradeFromPercentage(result.percentage);
        
        return [
          `"${result.studentName}"`,
          `"${result.regNo}"`,
          `"${result.department}"`,
          result.score,
          result.totalQuestions,
          result.percentage,
          `"${grade}"`,
          submissionDate.toLocaleDateString(),
          submissionDate.toLocaleTimeString()
        ].join(',');
      })
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // NEW: Helper function to get grade from percentage
  const getGradeFromPercentage = (percentage) => {
    if (percentage >= 90) return 'A+';
    else if (percentage >= 80) return 'A';
    else if (percentage >= 70) return 'B';
    else if (percentage >= 60) return 'C';
    else if (percentage >= 50) return 'D';
    else return 'F';
  };

// Add this helper function to determine role from email
const determineRoleFromEmail = (email) => {
  const domain = email.toLowerCase().split('@')[1];
  
  // Faculty/Admin domains
  const facultyDomains = [
    'faculty.college.edu',
    'admin.college.edu',
    'staff.college.edu',
    'instructor.college.edu'
  ];
  
  return facultyDomains.includes(domain) ? 'admin' : 'student';
};

const handleEmailChange = (email) => {
  setRegistrationData({...registrationData, email});
  
  if (email.includes('@')) {
    const role = determineRoleFromEmail(email);
    setPredictedRole(role);
  } else {
    setPredictedRole('');
  }
};

  // NEW: Handle CSV export for current results
  const handleExportCSV = () => {
    if (!resultSessionCode) {
      alert('Please enter a quiz code first!');
      return;
    }

    if (studentResults.length === 0) {
      alert('No results found to export!');
      return;
    }

    const currentSession = quizSessions.find(s => s.sessionId === resultSessionCode);
    const sessionName = currentSession ? currentSession.name : resultSessionCode;
    const filename = `Quiz_Results_${sessionName}_${resultSessionCode}_${new Date().toISOString().split('T')[0]}.csv`;
    
    exportToCSV(studentResults, filename);
  };

  // API Functions
  const apiCall = async (endpoint, method = 'GET', data = null) => {
    setLoading(true);
    setError('');
    
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (data) {
        config.body = JSON.stringify(data);
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      setError(error.message);
      console.error('API Error:', error);
      throw error;
    }
  };

  // Load quiz sessions on component mount and when needed
  const loadQuizSessions = async () => {
    try {
      const sessions = await apiCall('/api/quiz-sessions');
      setQuizSessions(sessions);
    } catch (error) {
      alert('Failed to load quiz sessions: ' + error.message);
    }
  };

  // Load results for a specific session
  const loadSessionResults = async (sessionId) => {
    try {
      const results = await apiCall(`/api/quiz-results/${sessionId}`);
      setStudentResults(results);
    } catch (error) {
      alert('Failed to load results: ' + error.message);
    }
  };

  // Add this new login handler:
const handleUserLogin = async () => {
  try {
    const response = await apiCall('/api/user/login', 'POST', { 
      email: userEmail,
      password: userPassword
    });
    
    if (response.success) {
      setCurrentUser(response.user);
      setUserRole(response.user.role);
      
      if (response.user.role === 'admin') {
        // Admin users go to admin code verification
        setCurrentView('admin');
      } else {
        // Student users go directly to quiz joining
        setCurrentView('student');
      }
    }
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
};

const handleUserRegistration = async () => {
  // Validation logic
  if (!registrationData.name || !registrationData.email || !registrationData.password) {
    setRegistrationError('Please fill all required fields');
    return;
  }
  
  if (registrationData.password !== registrationData.confirmPassword) {
    setRegistrationError('Passwords do not match');
    return;
  }
  
  // Auto-determine role from email
  const role = determineRoleFromEmail(registrationData.email);
  
  try {
    const response = await apiCall('/api/user/register', 'POST', {
      name: registrationData.name,
      email: registrationData.email,
      password: registrationData.password,
      role // Send auto-determined role
    });
    
    if (response.success) {
      alert(`Registration successful as ${role === 'admin' ? 'Faculty' : 'Student'}! Please login with your credentials.`);
      setShowRegistration(false);
      setRegistrationData({ name: '', email: '', password: '', confirmPassword: '' });
      setPredictedRole('');
      setRegistrationError('');
    }
  } catch (error) {
    setRegistrationError('Registration failed: ' + error.message);
  }
};

  // Admin authentication
  const handleAdminLogin = async () => {
    try {
      const response = await apiCall('/api/admin/login', 'POST', { 
        adminCode 
      });
      
      if (response.success) {
        setIsAdminAuthenticated(true);
        setCurrentView('admin');
        await loadQuizSessions(); // Load sessions after login
      } else {
        alert('Invalid admin code!');
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  // Create new quiz session
  const handleCreateSession = async () => {
    const sessionName = prompt('Enter Quiz Session Name:');
    if (sessionName) {
      try {
        const newSession = await apiCall('/api/quiz-sessions', 'POST', {
          name: sessionName,
          createdBy: 'admin'
        });
        
        setCurrentSessionId(newSession.sessionId);
        setActiveAdminSection('create');
        await loadQuizSessions(); // Refresh sessions list
        
        alert(`Session created with ID: ${newSession.sessionId}`);
      } catch (error) {
        alert('Failed to create session: ' + error.message);
      }
    }
  };

  // Add question to current session
  const handleAddQuestion = async () => {
    if (questionText && optionA && optionB && optionC && optionD && correctOption && currentSessionId) {
      try {
        const questionData = {
          question: questionText,
          options: { 
            a: optionA, 
            b: optionB, 
            c: optionC, 
            d: optionD 
          },
          correct: correctOption,
        };

        await apiCall(`/api/quiz-sessions/${currentSessionId}/questions`, 'POST', questionData);
        
        // Reset form
        setQuestionText('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setCorrectOption('');
        
        // Refresh sessions to show updated questions
        await loadQuizSessions();
        
        alert('Question added successfully!');
      } catch (error) {
        alert('Failed to add question: ' + error.message);
      }
    } else {
      alert('Please fill all fields!');
    }
  };

// KEEP your existing handleAddQuestion function

// ADD these new CSV functions:

// Handle CSV file selection
const handleCsvFileSelect = (event) => {
  const file = event.target.files[0];
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    setCsvFile(file);
    setCsvErrors([]);
    parseCsvFile(file);
  } else {
    alert('Please select a valid CSV file');
    event.target.value = '';
  }
};

// Parse CSV file using Papaparse
const parseCsvFile = (file) => {
  // Import Papaparse (it's available in your environment)
  import('papaparse').then(Papa => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          const errorMessages = results.errors.map(e => `Row ${e.row + 1}: ${e.message}`);
          setCsvErrors(errorMessages);
          alert('CSV parsing errors found. Check the preview section.');
          return;
        }
        
        // Validate CSV structure
        const requiredColumns = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer'];
        const csvColumns = Object.keys(results.data[0] || {});
        const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col));
        
        if (missingColumns.length > 0) {
          setCsvErrors([`Missing required columns: ${missingColumns.join(', ')}`]);
          alert(`Missing required columns: ${missingColumns.join(', ')}\n\nRequired columns: ${requiredColumns.join(', ')}`);
          return;
        }
        
        // Convert CSV data to question format
        const questions = results.data.map((row, index) => {
          const correctAnswer = row['Correct Answer']?.toString().trim().toUpperCase();
          
          return {
            question: row['Question']?.toString().trim(),
            options: {
              a: row['Option A']?.toString().trim(),
              b: row['Option B']?.toString().trim(),
              c: row['Option C']?.toString().trim(),
              d: row['Option D']?.toString().trim()
            },
            correct: correctAnswer,
            rowIndex: index + 2
          };
        });
        
        // Validate question data
        const validationErrors = [];
        questions.forEach((q, index) => {
          if (!q.question) validationErrors.push(`Row ${q.rowIndex}: Question is empty`);
          if (!q.options.a) validationErrors.push(`Row ${q.rowIndex}: Option A is empty`);
          if (!q.options.b) validationErrors.push(`Row ${q.rowIndex}: Option B is empty`);
          if (!q.options.c) validationErrors.push(`Row ${q.rowIndex}: Option C is empty`);
          if (!q.options.d) validationErrors.push(`Row ${q.rowIndex}: Option D is empty`);
          if (!['A', 'B', 'C', 'D'].includes(q.correct)) {
            validationErrors.push(`Row ${q.rowIndex}: Correct answer must be A, B, C, or D (found: ${q.correct})`);
          }
        });
        
        if (validationErrors.length > 0) {
          setCsvErrors(validationErrors);
        } else {
          setCsvErrors([]);
        }
        
        setCsvPreview(questions);
        setShowCsvPreview(true);
      },
      error: (error) => {
        setCsvErrors([`Error reading CSV file: ${error.message}`]);
        alert('Error reading CSV file: ' + error.message);
      }
    });
  });
};

// Upload CSV questions to backend
const handleCsvUpload = async () => {
  if (!csvPreview.length || !currentSessionId) {
    alert('No questions to upload or session not selected');
    return;
  }
  
  if (csvErrors.length > 0) {
    alert('Please fix the errors before uploading');
    return;
  }
  
  try {
    await apiCall(`/api/quiz-sessions/${currentSessionId}/questions/csv`, 'POST', {
      questions: csvPreview
    });
    
    // Reset CSV states
    setCsvFile(null);
    setCsvPreview([]);
    setShowCsvPreview(false);
    setCsvErrors([]);
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
    
    // Refresh sessions to show updated questions
    await loadQuizSessions();
    
    alert(`Successfully uploaded ${csvPreview.length} questions!`);
  } catch (error) {
    alert('Failed to upload CSV questions: ' + error.message);
  }
};

// Add passage to current session
// Add passage to current session
const handleAddPassage = async () => {
  if (!passageTitle.trim() || !passageText.trim() || !currentSessionId) {
    alert('Please fill in both title and passage text!');
    return;
  }
  
  try {
    const passageData = {
      title: passageTitle.trim(),
      content: passageText.trim(),
    };

    const response = await apiCall(`/api/quiz-sessions/${currentSessionId}/passages`, 'POST', passageData);
    
    // Reset form
    setPassageTitle('');
    setPassageText('');
    
    // Refresh sessions to show updated passages
    await loadQuizSessions();
    
    alert('Passage added successfully!');
  } catch (error) {
    alert('Failed to add passage: ' + error.message);
  }
};
// Handle audio file upload
const handleAudioFileSelect = (event) => {
  const file = event.target.files[0];
  if (file && file.type.startsWith('audio/')) {
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  } else {
    alert('Please select a valid audio file');
    event.target.value = '';
  }
};

// Upload audio to session
const handleAddAudio = async () => {
  if (!audioFile) {
    alert('Please select an audio file first!');
    return;
  }
  
  if (!currentSessionId) {
    alert('Please create or select a quiz session first!');
    return;
  }
  
  const formData = new FormData();
  formData.append('audio', audioFile);
  
  try {
    setLoading(true);
    const response = await fetch(`${API_BASE_URL}/api/quiz-sessions/${currentSessionId}/audio`, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      alert('Audio uploaded successfully!');
      setAudioFile(null);
      setAudioUrl('');
      // Clear the file input
      const fileInput = document.querySelector('input[type="file"][accept="audio/*"]');
      if (fileInput) fileInput.value = '';
      await loadQuizSessions();
    } else {
      const error = await response.text();
      alert('Failed to upload audio: ' + error);
    }
  } catch (error) {
    alert('Failed to upload audio: ' + error.message);
  } finally {
    setLoading(false);
  }
};


// Clear CSV upload
const clearCsvUpload = () => {
  setCsvFile(null);
  setCsvPreview([]);
  setShowCsvPreview(false);
  setCsvErrors([]);
  
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) fileInput.value = '';
};

  // Start quiz
  const handleStartQuiz = async () => {
    try {
      await apiCall(`/api/quiz-sessions/${currentSessionId}/start`, 'PUT');
      await loadQuizSessions(); // Refresh to show updated status
      alert(`Quiz Started! Students can join using code: ${currentSessionId}`);
    } catch (error) {
      alert('Failed to start quiz: ' + error.message);
    }
  };

  // End quiz
  const handleEndQuiz = async () => {
    try {
      await apiCall(`/api/quiz-sessions/${currentSessionId}/end`, 'PUT');
      await loadQuizSessions(); // Refresh to show updated status
      alert('Quiz Ended!');
    } catch (error) {
      alert('Failed to end quiz: ' + error.message);
    }
  };

  // Generate quiz link/code
  const handleGenerateLink = () => {
    const currentSession = quizSessions.find(s => s.sessionId === currentSessionId);
    if (currentSession && currentSession.questions.length > 0) {
      alert(`Quiz Code: ${currentSessionId}\nShare this code with students to join the quiz.`);
    } else {
      alert('Please add at least one question before generating the code.');
    }
  };

 //shuffle
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

 const handleJoinQuiz = async () => {
  try {
    const quiz = await apiCall(`/api/quiz-sessions/${quizCode.toUpperCase()}`);
    
    if (quiz) {
      if (quiz.isActive && quiz.questions.length > 0) {

        const shuffledQuestions = shuffleArray(quiz.questions).map((q) => {
          const optionsArray = [
            { label: 'A', text: q.options.a },
            { label: 'B', text: q.options.b },
            { label: 'C', text: q.options.c },
            { label: 'D', text: q.options.d },
          ];

          // 🔁 Shuffle options
          const shuffledOptions = shuffleArray(optionsArray);

          // 🔁 Rebuild options object and correct answer
          const newOptions = {};
          let newCorrect = '';

          shuffledOptions.forEach((opt, idx) => {
            const label = ['a', 'b', 'c', 'd'][idx];
            newOptions[label] = opt.text;
            if (opt.label === q.correct) {
              newCorrect = label.toUpperCase();
            }
          });

          return {
            ...q,
            options: newOptions,
            correct: newCorrect,
          };
        });
                       // Check if quiz has audio by making a test request
               try {
                 console.log(`Checking audio for session: ${quiz.sessionId}`);
                 const audioResponse = await fetch(`${API_BASE_URL}/api/quiz-sessions/${quiz.sessionId}/audio`, {
                   method: 'HEAD',
                   headers: {
                     'Accept': 'audio/*'
                   }
                 });
                 console.log(`Audio check response for ${quiz.sessionId}:`, audioResponse.status, audioResponse.ok);
                 quiz.hasAudio = audioResponse.ok && audioResponse.status === 200;
                 console.log(`Audio available for ${quiz.sessionId}:`, quiz.hasAudio);
               } catch (e) {
                 console.warn('Audio check failed:', e);
                 quiz.hasAudio = false;
               }
        
       // Update quiz with shuffled questions
        setCurrentQuiz({ ...quiz, questions: shuffledQuestions });
        setStudentView('form');
        setUserAnswers(new Array(shuffledQuestions.length).fill(null));
      } else if (!quiz.isActive) {
        alert('This quiz is not currently active. Please contact your instructor.');
      } else {
        alert('This quiz has no questions yet. Please try again later.');
      }
    }
  } catch (error) {
    alert('Invalid quiz code or quiz not found. Please check and try again.');
  }
};
 // ENHANCED: Load quiz violations
const loadQuizViolations = async (sessionId) => {
  try {
    setLoading(true);
    const violations = await apiCall(`/api/quiz-violations/${sessionId}`);

    // Filter out duplicates by regNo
    const uniqueViolations = [];
    const seenRegNos = new Set();

    for (const v of violations) {
      if (!seenRegNos.has(v.regNo)) {
        seenRegNos.add(v.regNo);
        uniqueViolations.push(v);
      }
    }

    setQuizViolations(uniqueViolations);
    setLoading(false);
  } catch (error) {
    setLoading(false);
    alert('Failed to load violations: ' + error.message);
  }
};


// Approve resume for student (no token)
const handleApproveResume = async (violationId) => {
  try {
    const response = await apiCall(`/api/quiz-violations/${violationId}/resume`, 'POST');
    if (response && response.success) {
      alert('Resume approved. The student can now continue the quiz.');
    } else {
      alert(response?.message || 'Resume approved.');
    }
    // Refresh violations list
    if (violationSessionCode) {
      await loadQuizViolations(violationSessionCode);
    }
  } catch (error) {
    alert('Failed to approve resume: ' + error.message);
  }
};

// ENHANCED: Admin restart specific student's quiz
const handleRestartStudentQuiz = async (violation) => {
  const confirmRestart = window.confirm(
    `Are you sure you want to restart the quiz for ${violation.studentName} (${violation.regNo})?\n\n` +
    `This will:\n` +
    `• Allow them to restart from question 1\n` +
    `• Give them full time allocation\n` +
    `• Reset their violation count\n` +
    `• Mark this violation as resolved`
  );

  if (!confirmRestart) return;

  try {
    const response = await apiCall(`/api/quiz-violations/${violation._id}/restart`, 'POST', {
      adminAction: true,
      restartReason: 'Admin approved restart due to violations'
    });

    if (response.success) {
      alert(`Quiz restart approved for ${violation.studentName}! The student can restart without a token.`);
      
      // Refresh violations list
      if (violationSessionCode) {
        await loadQuizViolations(violationSessionCode);
      }
    }
  } catch (error) {
    alert('Failed to approve quiz restart: ' + error.message);
  }
};


  // Start student quiz
  const startStudentQuiz = async () => {
    if (!studentInfo.name.trim() || !studentInfo.regNo.trim() || !studentInfo.department) {
      alert('Please fill in all required fields!');
      return;
    }
    
      // 🔁 Check if student has pending violation
  const pending = await checkPendingResume(studentInfo.name, studentInfo.regNo, currentQuiz.sessionId);
  if (pending) {
    // If true, they are already redirected to 'waitingForAdmin'
    return;
  }

    setStudentView('quiz');
    setCurrentQuestion(0);
    setTimeLeft(90 * 60);
    setTabSwitchCount(0); // UPDATED: Reset tab switch counter
  };

  // Select answer option
  const selectOption = (optionIndex) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = ['A', 'B', 'C', 'D'][optionIndex];
    setUserAnswers(newAnswers);
  };

  // Navigate to next question
  const nextQuestion = () => {
    if (currentQuestion === currentQuiz.questions.length - 1) {
      const unansweredCount = userAnswers.filter((a) => a === null).length;
      if (unansweredCount > 0 && timeLeft > 0) {
        setWarningMessage(`Please answer all questions before submitting. ${unansweredCount} question(s) remaining.`);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 4000);
        return;
      }
      submitQuiz();
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  // Navigate to previous question
  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };
// ENHANCED: Submit quiz with violation handling
const submitQuiz = useCallback(async (isAutoSubmit = false, violationType = null) => {
  if (!currentQuiz) return;
  
  try {
      // Prevent manual submit if unanswered and time remains
      if (!isAutoSubmit) {
        const unanswered = userAnswers.filter((a) => a === null).length;
        if (unanswered > 0 && timeLeft > 0) {
          setWarningMessage(`You still have ${unanswered} unanswered question(s). Please answer all questions before submitting.`);
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 4000);
          return;
        }
      }

    const correctAnswers = userAnswers.reduce((count, answer, index) => {
      return answer === currentQuiz.questions[index].correct ? count + 1 : count;
    }, 0);

    // If auto-submitted due to violations, save as violation instead of regular result
    if (isAutoSubmit && violationType) {
      const violationData = {
        sessionId: currentQuiz.sessionId,
        studentName: studentInfo.name,
        regNo: studentInfo.regNo,
        department: studentInfo.department,
        currentQuestion,
        userAnswers,
        timeLeft,
        violationType,
        tabSwitchCount,
        timeSpent: originalTimeAllotted - timeLeft
      };

      const response = await apiCall('/api/quiz-violations', 'POST', violationData);
      
      setViolationId(response.violationId);
      setStudentView('waitingForAdmin');
      setSuspensionMessage(
        `Your quiz has been suspended due to ${violationType.replace('_', ' ')}.\n\n` +
        `Please contact your instructor for assistance.`
      );
    }
  else {
      // Regular submission
      const resultData = {
        sessionId: currentQuiz.sessionId,
        studentName: studentInfo.name,
        regNo: studentInfo.regNo,
        department: studentInfo.department,
        answers: userAnswers,
        score: correctAnswers,
        totalQuestions: currentQuiz.questions.length,
        percentage: Math.round((correctAnswers / currentQuiz.questions.length) * 100),
        isAutoSubmit,
        isResumed: isResuming,
        timeSpent: originalTimeAllotted - timeLeft
      };

      await apiCall('/api/quiz-results', 'POST', resultData);
      setStudentView('result');
    }
  } catch (error) {
    alert('Failed to submit quiz: ' + error.message);
  }
}, [userAnswers, currentQuiz, studentInfo, currentQuestion, timeLeft, tabSwitchCount, isResuming, originalTimeAllotted]);

  // Restart student session
const restartStudent = () => {
  // Clean up audio
  const audio = document.querySelector('audio');
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  setIsAudioPlaying(false);
  
  setStudentView('codeEntry');
  setQuizCode('');
  setCurrentQuiz(null);
  setStudentInfo({ name: '', regNo: '', department: '' });
  setCurrentQuestion(0);
  setUserAnswers([]);
  setTimeLeft(90 * 60);
  setTabSwitchCount(0);
};

  // Load results when result session code changes
  useEffect(() => {
    if (resultSessionCode && activeAdminSection === 'results') {
      loadSessionResults(resultSessionCode);
    }
  }, [resultSessionCode, activeAdminSection]);

  // Load violations when violation session code changes
useEffect(() => {
  if (violationSessionCode && activeAdminSection === 'violations') {
    loadQuizViolations(violationSessionCode);
  }
}, [violationSessionCode, activeAdminSection]);

  // Timer effect for student quiz
  useEffect(() => {
    let timerInterval;
    
    if (studentView === 'quiz' && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            submitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [studentView, timeLeft, submitQuiz]);

 useEffect(() => {
   if (studentView !== 'quiz') return;
 
   const handleContextMenu = (e) => e.preventDefault();
   const handleKeyDown = (e) => {
     if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'x')) {
       e.preventDefault();
     }
   };
 
   document.addEventListener('contextmenu', handleContextMenu);
   document.addEventListener('keydown', handleKeyDown);
 
   return () => {
     document.removeEventListener('contextmenu', handleContextMenu);
     document.removeEventListener('keydown', handleKeyDown);
   };
 }, [studentView]);


  // Security effects for student quiz
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (studentView === 'quiz') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    // UPDATED: Modified visibility change handler for tab switch tracking
    const handleVisibilityChange = () => {
      if (document.hidden && studentView === 'quiz') {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          
          if (newCount === 1) {
      setWarningMessage("⚠️ WARNING: Do not switch tabs! Next time your quiz will be auto-submitted!");
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 4000);
      return newCount;
    } else if (newCount >= 2) {
      setWarningMessage("🚫 QUIZ AUTO-SUBMITTED: You switched tabs multiple times!");
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 4000);
      submitQuiz(true, 'tab_switch_violation');
      return newCount;
    }

          
          return newCount;
        });
      }
    };

    const handleKeyDown = (e) => {
      if (studentView === 'quiz' && (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'r') ||
        (e.key === 'F5')
      )) {
        e.preventDefault();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }
    };

    const handleContextMenu = (e) => {
      if (studentView === 'quiz') {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [studentView, submitQuiz]);

 useEffect(() => {
  const handleResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    const widthRatio = width / screenWidth;
    const heightRatio = height / screenHeight;

    if ((widthRatio < 0.8 || heightRatio < 0.8) && studentView === 'quiz') {
      if (violationCount === 0) {
        // First warning
        setViolationCount(1);
        setWarningMessage("⚠️ SPLIT SCREEN DETECTED: Please maximize your screen. Split screen is not allowed during the quiz.");
setShowWarning(true);
setTimeout(() => setShowWarning(false), 4000);

      } else {
        // Second violation - submit quiz
        setWarningMessage('Split screen detected again. Your quiz has been auto-submitted.');
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 4000);
    submitQuiz(true, 'split_screen_violation');
      }
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [studentView, submitQuiz, violationCount]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateStudentResults = () => {
    if (!currentQuiz) return { correctAnswers: 0, wrongAnswers: 0, scorePercentage: 0, grade: 'F' };
    
    const correctAnswers = userAnswers.reduce((count, answer, index) => {
      return answer === currentQuiz.questions[index].correct ? count + 1 : count;
    }, 0);
    
    const totalQuestions = currentQuiz.questions.length;
    const wrongAnswers = totalQuestions - correctAnswers;
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    let grade;
    if (scorePercentage >= 90) grade = 'A+';
    else if (scorePercentage >= 80) grade = 'A';
    else if (scorePercentage >= 70) grade = 'B';
    else if (scorePercentage >= 60) grade = 'C';
    else if (scorePercentage >= 50) grade = 'D';
    else grade = 'F';

    return { correctAnswers, wrongAnswers, scorePercentage, grade };
  };

// Student: Poll and continue automatically once admin approves
const handleResumeQuiz = async () => {
  if (!violationId) {
    alert('Waiting for admin approval...');
    return;
  }
  try {
    const response = await apiCall(`/api/quiz-violations/${violationId}/continue`, 'POST');

    if (response.success) {
      // Check for audio in resumed quiz
      try {
        const audioResponse = await fetch(`${API_BASE_URL}/api/quiz-sessions/${response.quizData.sessionId}/audio`, { 
          method: 'HEAD',
          headers: { 'Accept': 'audio/*' }
        });
        response.quizData.hasAudio = audioResponse.ok && audioResponse.status === 200;
      } catch (e) {
        response.quizData.hasAudio = false;
      }
      
      if (response.actionType === 'resume') {
        setCurrentQuiz(response.quizData);
        setStudentInfo(response.studentInfo);
        setCurrentQuestion(response.currentQuestion);
        setUserAnswers(response.userAnswers);
        setTimeLeft(response.timeLeft);
        setTabSwitchCount(0);
        setIsResuming(true);
        setStudentView('quiz');
        alert('Quiz resumed successfully!');
      } else if (response.actionType === 'restart') {
        setCurrentQuiz(response.quizData);
        setStudentInfo(response.studentInfo);
        setCurrentQuestion(0);
        setUserAnswers(new Array(response.quizData.questions.length).fill(null));
        setTimeLeft(response.quizData.timeLimit || 90 * 60);
        setOriginalTimeAllotted(response.quizData.timeLimit || 90 * 60);
        setTabSwitchCount(0);
        setIsResuming(true);
        setStudentView('quiz');
        alert('Quiz restarted successfully!');
      }
    }
  } catch (error) {
    alert(error?.message || 'Approval not ready yet.');
  }
};

// Auto-polling to continue as soon as admin approves
const tryAutoResume = useCallback(async () => {
  if (!violationId || studentView !== 'waitingForAdmin') return;
  try {
    const response = await apiCall(`/api/quiz-violations/${violationId}/continue`, 'POST');
    if (!response?.success) return;

    // Check audio quietly
    try {
      const audioResponse = await fetch(`${API_BASE_URL}/api/quiz-sessions/${response.quizData.sessionId}/audio`, { method: 'HEAD', headers: { 'Accept': 'audio/*' } });
      response.quizData.hasAudio = audioResponse.ok && audioResponse.status === 200;
    } catch {
      response.quizData.hasAudio = false;
    }

    if (response.actionType === 'resume') {
      setCurrentQuiz(response.quizData);
      setStudentInfo(response.studentInfo);
      setCurrentQuestion(response.currentQuestion);
      setUserAnswers(response.userAnswers);
      setTimeLeft(response.timeLeft);
      setTabSwitchCount(0);
      setIsResuming(true);
      setStudentView('quiz');
    } else if (response.actionType === 'restart') {
      setCurrentQuiz(response.quizData);
      setStudentInfo(response.studentInfo);
      setCurrentQuestion(0);
      setUserAnswers(new Array(response.quizData.questions.length).fill(null));
      setTimeLeft(response.quizData.timeLimit || 90 * 60);
      setOriginalTimeAllotted(response.quizData.timeLimit || 90 * 60);
      setTabSwitchCount(0);
      setIsResuming(true);
      setStudentView('quiz');
    }
  } catch {
    // Ignore until approved
  }
}, [violationId, studentView, API_BASE_URL]);

useEffect(() => {
  if (studentView === 'waitingForAdmin' && violationId) {
    const id = setInterval(() => {
      tryAutoResume();
    }, 3000);
    return () => clearInterval(id);
  }
}, [studentView, violationId, tryAutoResume]);

// ENHANCED: Check for pending violations when student tries to join
const checkPendingResume = async (studentName, regNo, sessionId) => {
  try {
    const response = await apiCall('/api/quiz-violations/check-pending', 'POST', {
      studentName,
      regNo,
      sessionId
    });

    if (response.hasPendingViolation) {
      setViolationId(response.violationId);
      setStudentView('waitingForAdmin');
      setSuspensionMessage(
        `Your quiz was suspended due to ${response.violationType.replace('_', ' ')}.\n\n` +
        `Please wait for your instructor to approve your quiz continuation.`
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking pending resume:', error);
    return false;
  }
};

  // Styles
  const styles = {
   container: {
  minHeight: '100vh',
  backgroundImage: 'url("/img.jpg")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
}
,
creditGuidanceContainer: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginTop: '50px',
  padding: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.85)',
  borderRadius: '12px',
  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  fontFamily: 'Segoe UI, sans-serif'
},

creditBox: {
  width: '45%'
},

creditHeading: {
  fontSize: '18px',
  marginBottom: '8px',
  color: '#333',
  borderBottom: '2px solid #aaa',
  display: 'inline-block'
},

creditText: {
  margin: 0,
  lineHeight: '1.6',
  fontSize: '16px'
}
,
    card: {
  maxWidth: '600px',
  margin: '0 auto',
  background: 'rgba(255, 255, 255, 0.85)', // Semi-transparent white
  backdropFilter: 'blur(8px)',            // Frosted effect
  borderRadius: '40px 10px',              // Inverted rectangle
  padding: '40px 30px',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)', // Soft shadow
  border: '2px solid rgba(255,255,255,0.3)',
  transition: 'all 0.3s ease',
}
,
    button: {
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '25px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      margin: '5px',
      transition: 'all 0.3s ease',
      opacity: loading ? 0.7 : 1
    },
    // NEW: CSV Export Button Style
    csvButton: {
      background: 'linear-gradient(45deg, #4CAF50, #45a049)',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      margin: '5px',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    input: {
      width: '100%',
      padding: '12px',
      margin: '10px 0',
      border: '2px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '12px',
      margin: '10px 0',
      border: '2px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px',
      boxSizing: 'border-box',
      background: 'white'
    },
    option: (isSelected) => ({
      padding: '15px',
      margin: '10px 0',
      border: `2px solid ${isSelected ? '#667eea' : '#ddd'}`,
      borderRadius: '10px',
      cursor: 'pointer',
      backgroundColor: isSelected ? '#f0f4ff' : 'white',
      transition: 'all 0.3s ease'
    }),
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: '#e0e0e0',
      borderRadius: '4px',
      marginBottom: '20px',
      overflow: 'hidden'
    },
    progressFill: (width) => ({
      height: '100%',
      backgroundColor: '#667eea',
      width: `${width}%`,
      transition: 'width 0.3s ease'
    }),
    timer: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#f44336',
      textAlign: 'center',
      padding: '10px',
      border: '2px solid #f44336',
      borderRadius: '10px',
      marginBottom: '20px'
    },
    questionCard: {
      background: '#f9f9f9',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px',
      borderLeft: '4px solid #667eea'
    },
    resultCard: {
      background: '#f0f8ff',
      padding: '20px',
      borderRadius: '15px',
      textAlign: 'center',
      margin: '20px 0'
    },
    scoreCircle: (percentage) => ({
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      background: `conic-gradient(#4CAF50 ${percentage * 3.6}deg, #e0e0e0 0deg)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '20px auto',
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#333'
    }),
    warningBanner: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#f44336',
      color: 'white',
      padding: '15px',
      textAlign: 'center',
      zIndex: 1000,
      fontSize: '16px',
      fontWeight: 'bold'
    },
    errorMessage: {
      background: '#f8d7da',
      color: '#721c24',
      padding: '10px',
      borderRadius: '5px',
      margin: '10px 0',
      border: '1px solid #f5c6cb'
    },
    loadingSpinner: {
      display: 'inline-block',
      marginLeft: '10px',
      fontSize: '16px'
    },
    // NEW: Results header style
    resultsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '10px'
    },
  
violationCard: {
  background: '#fff3cd',
  padding: '20px',
  margin: '15px 0',
  borderRadius: '10px',
  borderLeft: '4px solid #ffc107',
  border: '1px solid #ffeaa7'
},
resumeButton: {
  background: 'linear-gradient(45deg, #FF9800, #F57C00)',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '15px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 'bold',
  margin: '2px',
  transition: 'all 0.3s ease'
},
waitingCard: {
  background: '#e3f2fd',
  padding: '30px',
  borderRadius: '15px',
  textAlign: 'center',
  margin: '20px 0',
  border: '2px solid #bbdefb'
},
// Add these to the styles object
passageModal: {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
},
passageContent: {
  background: 'white',
  padding: '30px',
  borderRadius: '15px',
  maxWidth: '700px',
  maxHeight: '80vh',
  overflow: 'auto',
  margin: '20px',
  position: 'relative'
},
passageButton: {
  background: 'linear-gradient(45deg, #2196F3, #1976D2)',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '15px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 'bold',
  margin: '2px 5px',
  transition: 'all 0.3s ease'
},
audioPlayer: {
  background: '#fff0f5',
  padding: '15px',
  borderRadius: '10px',
  border: '2px solid #e91e63',
  marginTop: '20px'
},

audioButton: {
  background: 'linear-gradient(45deg, #e91e63, #c2185b)',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '15px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 'bold',
  margin: '2px 5px',
  transition: 'all 0.3s ease'
},footerBlack: {
  backgroundColor: '#999ba0ff',
  color: '#681c1cff',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'flex-start',
  padding: '40px 20px',
  marginTop: '60px',
  fontFamily: 'Segoe UI, sans-serif',
  fontSize: '15px',
  borderTop: '2px solid #b0bec0ff',
  borderRadius: '20px 20px 0 0',
  position: 'relative'
},

footerColumn: {
  width: '45%',
  textAlign: 'left'
},

footerHeading: {
  fontSize: '16px',
  fontWeight: '600',
  marginBottom: '10px',
  borderBottom: '1px solid #555',
  paddingBottom: '5px'
},

footerText: {
  margin: 0,
  lineHeight: '1.7',
  fontSize: '14px',
  color: '#f4e3e3ff'
},

verticalDivider: {
  width: '1px',
  backgroundColor: '#444',
  margin: '0 20px'
}

  };

  // Loading and Error Display Component
  const LoadingError = () => (
    <>
      {loading && <span style={styles.loadingSpinner}>⏳ Loading...</span>}
      {error && <div style={styles.errorMessage}>❌ Error: {error}</div>}
    </>
  );

  // Home page
 if (currentView === 'home') {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <LoadingError />
       <div style={{ textAlign: 'center', marginBottom: '30px' }}>
  <img 
    src="/logo.png" 
    alt="TCE Logo" 
    style={{ maxWidth: '120px', height: 'auto', marginBottom: '10px' }} 
  />
   
  <h1 style={{ 
    fontSize: '2rem', 
    color: '#800000', /* Dark red like TCE site */
    fontWeight: 'bold', 
    margin: '10px 0' 
  }}>
    Thiagarajar College of Engineering
  </h1>

  <h2 style={{ 
    fontSize: '1.5rem', 
    color: '#333', 
    marginBottom: '10px' 
  }}>
    Department of English
  </h2>

  <h3 style={{ 
    fontSize: '1.2rem', 
    color: '#555', 
    marginBottom: '20px' 
  }}>
    First Year Diagnostic Test - 2025
  </h3>

  
</div>


        {!showRegistration ? (
          // LOGIN FORM
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Enter your password"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              style={styles.input}
              onKeyPress={(e) => e.key === 'Enter' && handleUserLogin()}
              disabled={loading}
            />
            <div style={{ textAlign: 'center' }}>
              <button style={styles.button} onClick={handleUserLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ color: '#666' }}>Don't have an account?</p>
              <button 
                style={{...styles.button, background: 'linear-gradient(45deg, #4CAF50, #45a049)'}} 
                onClick={() => setShowRegistration(true)}
                disabled={loading}
              >
                Register Here
              </button>
            </div>
          </div>
        ) : (
          // REGISTRATION FORM
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            {registrationError && (
              <div style={styles.errorMessage}>
                {registrationError}
              </div>
            )}
            
            <input
              type="text"
              placeholder="Full Name *"
              value={registrationData.name}
              onChange={(e) => setRegistrationData({...registrationData, name: e.target.value})}
              style={styles.input}
              disabled={loading}
            />
           <input
  type="email"
  placeholder="Email Address *"
  value={registrationData.email}
  onChange={(e) => handleEmailChange(e.target.value)}
  style={styles.input}
  disabled={loading}
/>


            <input
              type="password"
              placeholder="Password *"
              value={registrationData.password}
              onChange={(e) => setRegistrationData({...registrationData, password: e.target.value})}
              style={styles.input}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Confirm Password *"
              value={registrationData.confirmPassword}
              onChange={(e) => setRegistrationData({...registrationData, confirmPassword: e.target.value})}
              style={styles.input}
              disabled={loading}
            />
            
            
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button style={styles.button} onClick={handleUserRegistration} disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ color: '#666' }}>Already have an account?</p>
              <button 
                style={{...styles.button, background: 'linear-gradient(45deg, #667eea, #764ba2)'}} 
                onClick={() => {
                  setShowRegistration(false);
                  setRegistrationError('');
                }}
                disabled={loading}
              >
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

  /*if (currentView === 'home') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <LoadingError />
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '3rem', color: '#333', marginBottom: '10px' }}>🎓 Quiz Portal</h1>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>Choose your role to continue</p>
            <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '10px' }}>
              Backend Integration: {API_BASE_URL}
            </p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👨‍🎓</div>
              <h3 style={{ marginBottom: '20px' }}>Student</h3>
              <p style={{ marginBottom: '20px', color: '#666' }}>Take a quiz using the code provided by your instructor</p>
              <button style={styles.button} onClick={() => setCurrentView('student')} disabled={loading}>
                Join Quiz
              </button>
            </div>
            
            <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👨‍🏫</div>
              <h3 style={{ marginBottom: '20px' }}>Admin</h3>
              <p style={{ marginBottom: '20px', color: '#666' }}>Create and manage quizzes, view results</p>
              <button style={styles.button} onClick={() => setCurrentView('admin')} disabled={loading}>
                Admin Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }*/

  // Admin Panel
  if (currentView === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <LoadingError />
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setCurrentView('home')} disabled={loading}>
                ← Back to Home
              </button>
              <h2>Admin Login</h2>
              <p style={{ color: '#666' }}>Enter admin code to continue</p>
            </div>
            <input
              type="password"
              placeholder="Enter admin code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              style={styles.input}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              disabled={loading}
            />
            <div style={{ textAlign: 'center' }}>
              <button style={styles.button} onClick={handleAdminLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Admin Dashboard
    if (!activeAdminSection) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <LoadingError />
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <button style={{...styles.button, marginBottom: '20px'}} onClick={() => {
                setCurrentView('home');
                setIsAdminAuthenticated(false);
                setAdminCode('');
              }} disabled={loading}>
                ← Logout
              </button>
              <h1>Admin Dashboard</h1>
              <p style={{ color: '#666' }}>Total Sessions: {quizSessions.length}</p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📝</div>
                <h3>Create Quiz</h3>
                <button style={styles.button} onClick={handleCreateSession} disabled={loading}>Create</button>
              </div>
              
              <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
                <h3>View Results</h3>
                <button style={styles.button} onClick={() => setActiveAdminSection('results')} disabled={loading}>View</button>
              </div>
              
              <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
                <h3>Quiz Sessions</h3>
                <button style={styles.button} onClick={() => setActiveAdminSection('sessions')} disabled={loading}>Manage</button>
              </div>
              <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
  <h3>Quiz Violations</h3>
  <button style={styles.button} onClick={() => setActiveAdminSection('violations')} disabled={loading}>View</button>
</div>
            </div>
          </div>
        </div>
      );
    }

   // Create Quiz Section - Both Manual Entry AND CSV Upload
if (activeAdminSection === 'create') {
  const currentSession = quizSessions.find(s => s.sessionId === currentSessionId);
  
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <LoadingError />
        <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setActiveAdminSection(null)} disabled={loading}>
          ← Back to Dashboard
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2>Create Quiz: {currentSession?.name}</h2>
          <p style={{ color: '#666', fontSize: '18px' }}>Quiz Code: <strong>{currentSessionId}</strong></p>
        </div>
        
        {/* Method Selection Toggle */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', background: '#f0f0f0', borderRadius: '25px', padding: '5px' }}>
            <button
              style={{
                ...styles.button,
                background: entryMethod === 'manual' ? 'linear-gradient(45deg, #667eea, #764ba2)' : 'transparent',
                color: entryMethod === 'manual' ? 'white' : '#666',
                border: 'none',
                borderRadius: '20px',
                margin: '0 5px',
                padding: '10px 20px'
              }}
              onClick={() => setEntryMethod('manual')}
              disabled={loading}
            >
              ✏️ Manual Entry
            </button>
            <button
              style={{
                ...styles.button,
                background: entryMethod === 'csv' ? 'linear-gradient(45deg, #667eea, #764ba2)' : 'transparent',
                color: entryMethod === 'csv' ? 'white' : '#666',
                border: 'none',
                borderRadius: '20px',
                margin: '0 5px',
                padding: '10px 20px'
              }}
              onClick={() => setEntryMethod('csv')}
              disabled={loading}
            >
              📊 CSV Upload
            </button>
            <button
    style={{
      ...styles.button,
      background: entryMethod === 'comprehension' ? 'linear-gradient(45deg, #667eea, #764ba2)' : 'transparent',
      color: entryMethod === 'comprehension' ? 'white' : '#666',
      border: 'none',
      borderRadius: '20px',
      margin: '0 5px',
      padding: '10px 20px'
    }}
    onClick={() => setEntryMethod('comprehension')}
    disabled={loading}
  >
    📖 Comprehension
  </button>
          </div>
        </div>
        
        {/* Manual Entry Section */}
        {entryMethod === 'manual' && (
          <div style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '15px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✏️</div>
              <h3 style={{ color: '#667eea' }}>Add Questions Manually</h3>
            </div>
            
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question"
              style={styles.input}
              disabled={loading}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="text"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder="Option A"
                style={styles.input}
                disabled={loading}
              />
              <input
                type="text"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder="Option B"
                style={styles.input}
                disabled={loading}
              />
              <input
                type="text"
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                placeholder="Option C"
                style={styles.input}
                disabled={loading}
              />
              <input
                type="text"
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
                placeholder="Option D"
                style={styles.input}
                disabled={loading}
              />
            </div>
            
            <select
              value={correctOption}
              onChange={(e) => setCorrectOption(e.target.value)}
              style={styles.select}
              disabled={loading}
            >
              <option value="">Select Correct Answer</option>
              <option value="A">Option A</option>
              <option value="B">Option B</option>
              <option value="C">Option C</option>
              <option value="D">Option D</option>
            </select>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <button style={styles.button} onClick={handleAddQuestion} disabled={loading}>
                {loading ? 'Adding...' : '➕ Add Question'}
              </button>
            </div>
          </div>
        )}

        <button
  style={{
    ...styles.button,
    background: entryMethod === 'audio' ? 'linear-gradient(45deg, #667eea, #764ba2)' : 'transparent',
    color: entryMethod === 'audio' ? 'white' : '#666',
    border: 'none',
    borderRadius: '20px',
    margin: '0 5px',
    padding: '10px 20px'
  }}
  onClick={() => setEntryMethod('audio')}
  disabled={loading}
>
  🎵 Audio 
  </button>
        {/* Audio Upload Section */}
{entryMethod === 'audio' && (
  <div style={{ marginBottom: '30px', padding: '25px', background: '#fff0f5', borderRadius: '15px', border: '2px dashed #e91e63' }}>
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎵</div>
      <h3 style={{ color: '#e91e63', marginBottom: '15px' }}>Add Audio File</h3>
    </div>
    
    <input
      type="file"
      accept="audio/*"
      onChange={handleAudioFileSelect}
      style={{
        ...styles.input,
        padding: '15px',
        border: '2px dashed #e91e63',
        background: '#fff',
        cursor: 'pointer'
      }}
      disabled={loading}
    />
    
    {audioUrl && (
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <audio controls style={{ width: '100%', maxWidth: '400px' }}>
          <source src={audioUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
        
        <div style={{ marginTop: '15px' }}>
          <button
            style={{
              ...styles.button,
              background: 'linear-gradient(45deg, #e91e63, #c2185b)',
              marginRight: '15px'
            }}
            onClick={handleAddAudio}
            disabled={loading}
          >
            {loading ? 'Uploading...' : '🎵 Upload Audio'}
          </button>
          <button
            style={{...styles.button, background: 'linear-gradient(45deg, #f44336, #da190b)'}}
            onClick={() => {
              setAudioFile(null);
              setAudioUrl('');
              document.querySelector('input[type="file"][accept="audio/*"]').value = '';
            }}
            disabled={loading}
          >
            🗑️ Clear
          </button>
        </div>
      </div>
    )}
  </div>
)}
        
        {/* CSV Upload Section */}
        {entryMethod === 'csv' && (
          <div style={{ marginBottom: '30px', padding: '25px', background: '#f0f8ff', borderRadius: '15px', border: '2px dashed #667eea' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
              <h3 style={{ color: '#667eea', marginBottom: '15px' }}>Upload Questions via CSV</h3>
            </div>
            
            <div style={{ marginBottom: '20px', padding: '15px', background: '#fff', borderRadius: '10px', border: '1px solid #ddd' }}>
              <p style={{ color: '#333', marginBottom: '10px', fontWeight: 'bold' }}>
                📋 Required CSV Format:
              </p>
              <p style={{ color: '#666', marginBottom: '10px', fontFamily: 'monospace', fontSize: '14px' }}>
                Question, Option A, Option B, Option C, Option D, Correct Answer
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                • Correct Answer should be: A, B, C, or D<br />
                • All fields are required<br />
                • First row should contain column headers
              </p>
            </div>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvFileSelect}
              style={{
                ...styles.input, 
                padding: '15px',
                border: '2px dashed #667eea',
                background: '#fff',
                cursor: 'pointer'
              }}
              disabled={loading}
            />
            
            {/* Error Display */}
            {csvErrors.length > 0 && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: '#f8d7da',
                borderRadius: '10px',
                border: '1px solid #f5c6cb'
              }}>
                <h4 style={{ color: '#721c24', marginBottom: '10px' }}>❌ Errors Found:</h4>
                <ul style={{ color: '#721c24', margin: '0', paddingLeft: '20px' }}>
                  {csvErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Preview Section */}
            {showCsvPreview && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#333', marginBottom: '15px' }}>
                  📝 Preview ({csvPreview.length} questions found)
                  {csvErrors.length === 0 && <span style={{ color: '#4CAF50', marginLeft: '10px' }}>✅ Ready to upload</span>}
                </h4>
                
                <div style={{ 
                  maxHeight: '350px', 
                  overflowY: 'auto', 
                  border: '1px solid #ddd', 
                  borderRadius: '10px',
                  background: '#fff'
                }}>
                  {csvPreview.slice(0, 3).map((q, index) => (
                    <div key={index} style={{
                      ...styles.questionCard, 
                      margin: '15px',
                      borderLeft: csvErrors.length === 0 ? '4px solid #4CAF50' : '4px solid #f44336'
                    }}>
                      <strong>Q{index + 1}:</strong> {q.question}<br />
                      <div style={{ marginTop: '10px', fontSize: '14px' }}>
                        <strong>A)</strong> {q.options.a}<br />
                        <strong>B)</strong> {q.options.b}<br />
                        <strong>C)</strong> {q.options.c}<br />
                        <strong>D)</strong> {q.options.d}<br />
                        <strong style={{ color: '#4CAF50' }}>Correct: {q.correct}</strong>
                      </div>
                    </div>
                  ))}
                  {csvPreview.length > 3 && (
                    <p style={{ textAlign: 'center', color: '#666', padding: '15px', fontStyle: 'italic' }}>
                      ... and {csvPreview.length - 3} more questions
                    </p>
                  )}
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '25px' }}>
                  <button 
                    style={{
                      ...styles.button, 
                      background: csvErrors.length === 0 ? 'linear-gradient(45deg, #4CAF50, #45a049)' : 'gray',
                      marginRight: '15px',
                      cursor: csvErrors.length === 0 ? 'pointer' : 'not-allowed'
                    }} 
                    onClick={handleCsvUpload}
                    disabled={loading || csvErrors.length > 0}
                  >
                    {loading ? 'Uploading...' : `📤 Upload ${csvPreview.length} Questions`}
                  </button>
                  <button 
                    style={{...styles.button, background: 'linear-gradient(45deg, #f44336, #da190b)'}} 
                    onClick={clearCsvUpload}
                    disabled={loading}
                  >
                    🗑️ Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comprehension Passage Section */}
{entryMethod === 'comprehension' && (
  <div style={{ marginBottom: '30px', padding: '25px', background: '#f0fff0', borderRadius: '15px', border: '2px dashed #4CAF50' }}>
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📖</div>
      <h3 style={{ color: '#4CAF50', marginBottom: '15px' }}>Add Reference Passage</h3>
    </div>
    
    <input
      type="text"
      value={passageTitle}
      onChange={(e) => setPassageTitle(e.target.value)}
      placeholder="Enter passage title (e.g., 'Passage 1', 'Reading Comprehension')"
      style={styles.input}
      disabled={loading}
    />
    
    <textarea
      value={passageText}
      onChange={(e) => setPassageText(e.target.value)}
      placeholder="Enter the complete passage text here..."
      style={{
        ...styles.input,
        minHeight: '200px',
        resize: 'vertical',
        fontFamily: 'Arial, sans-serif',
        lineHeight: '1.5'
      }}
      disabled={loading}
    />
    
    <div style={{ textAlign: 'center', marginTop: '25px' }}>
      <button 
        style={{
          ...styles.button,
          background: 'linear-gradient(45deg, #4CAF50, #45a049)',
          marginRight: '15px'
        }} 
        onClick={handleAddPassage}
        disabled={loading || !passageTitle.trim() || !passageText.trim()}
      >
        {loading ? 'Adding...' : `📝 Add Passage`}
      </button>
    </div>
  </div>
)}
        
        {/* Quiz Control Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
          <button style={styles.button} onClick={handleGenerateLink} disabled={loading}>🔗 Get Quiz Code</button>
          <button style={{...styles.button, background: 'linear-gradient(45deg, #4CAF50, #45a049)'}} onClick={handleStartQuiz} disabled={loading}>
            {loading ? 'Starting...' : '▶️ Start Quiz'}
          </button>
          <button style={{...styles.button, background: 'linear-gradient(45deg, #f44336, #da190b)'}} onClick={handleEndQuiz} disabled={loading}>
            {loading ? 'Ending...' : '⏹️ End Quiz'}
          </button>
        </div>
        
        {/* Display Current Questions */}
        {currentSession && currentSession.questions && currentSession.questions.length > 0 && (
          <div>
            <h3>Questions Added ({currentSession.questions.length})</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {currentSession.questions.map((q, index) => (
                <div key={index} style={styles.questionCard}>
                  <strong>Q{index + 1}:</strong> {q.question}<br />
                  <div style={{ marginTop: '10px' }}>
                    A) {q.options.a}<br />
                    B) {q.options.b}<br />
                    C) {q.options.c}<br />
                    D) {q.options.d}<br />
                    <strong style={{ color: '#4CAF50' }}>Correct: {q.correct}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

    // Results Section - UPDATED WITH CSV EXPORT
    if (activeAdminSection === 'results') {
      const filteredResults = studentResults.filter(result => {
  if (resultFilter === 'above80') return result.percentage >= 80;
  if (resultFilter === 'below40') return result.percentage < 40;
  return true; // default: show all
});
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <LoadingError />
            <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setActiveAdminSection(null)} disabled={loading}>
              ← Back to Dashboard
            </button>
            
            <div style={styles.resultsHeader}>
              <h2>Quiz Results</h2>
              {resultSessionCode && studentResults.length > 0 && (
                <button 
                  style={styles.csvButton} 
                  onClick={handleExportCSV}
                  disabled={loading}
                  title="Export results to CSV file"
                >
                  📊 Export CSV
                </button>
              )}
            </div>

            {/* Filter Buttons: All, Above 80%, Below 40% */}
<div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
  <button 
    style={{ ...styles.button, background: resultFilter === 'all' ? '#2196F3' : '#ccc' }}
    onClick={() => setResultFilter('all')}
  >
    All
  </button>
  <button 
    style={{ ...styles.button, background: resultFilter === 'above80' ? '#4CAF50' : '#ccc' }}
    onClick={() => setResultFilter('above80')}
  >
    ≥ 80%
  </button>
  <button 
    style={{ ...styles.button, background: resultFilter === 'below40' ? '#f44336' : '#ccc' }}
    onClick={() => setResultFilter('below40')}
  >
    &lt; 40%
  </button>
</div>

            
            <input
              type="text"
              placeholder="Enter quiz code to view results"
              value={resultSessionCode}
              onChange={(e) => setResultSessionCode(e.target.value.toUpperCase())}
              style={styles.input}
              disabled={loading}
            />
            
            <div style={{ marginTop: '30px' }}>
              {resultSessionCode && (
                <div>
                  <div style={styles.resultsHeader}>
                    <h3>Results for: {resultSessionCode}</h3>
                    {studentResults.length > 0 && (
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        📈 Average Score: {Math.round(studentResults.reduce((sum, result) => sum + result.percentage, 0) / studentResults.length)}%
                      </div>
                    )}
                  </div>
                  {studentResults.length > 0 ? (
                    <div>
                      <p style={{ color: '#666', marginBottom: '20px' }}>
                        Total Submissions: {studentResults.length}
                      </p>
                      {filteredResults.map((result, index) => (
                        <div key={index} style={{
                          background: '#f9f9f9',
                          padding: '20px',
                          margin: '15px 0',
                          borderRadius: '10px',
                          borderLeft: `4px solid ${result.percentage >= 70 ? '#4CAF50' : result.percentage >= 50 ? '#ff9800' : '#f44336'}`
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                            <div><strong>Name:</strong> {result.studentName}</div>
                            <div><strong>Reg No:</strong> {result.regNo}</div>
                            <div><strong>Department:</strong> {result.department}</div>
                            <div>
                              <strong>Score:</strong> {result.score}/{result.totalQuestions} ({result.percentage}%)
                              <span style={{ 
                                marginLeft: '10px', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '12px', 
                                fontWeight: 'bold',
                                background: result.percentage >= 90 ? '#4CAF50' : 
                                           result.percentage >= 80 ? '#8BC34A' :
                                           result.percentage >= 70 ? '#FFC107' :
                                           result.percentage >= 60 ? '#FF9800' :
                                           result.percentage >= 50 ? '#FF5722' : '#f44336',
                                color: 'white'
                              }}>
                                {getGradeFromPercentage(result.percentage)}
                              </span>
                            </div>
                            <div><strong>Submitted:</strong> {new Date(result.submittedAt).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Summary Statistics */}
                      <div style={{
                        background: '#e3f2fd',
                        padding: '20px',
                        borderRadius: '10px',
                        marginTop: '20px',
                        borderLeft: '4px solid #2196F3'
                      }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#1976D2' }}>📊 Summary Statistics</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                          <div>
                            <strong>Total Students:</strong><br />
                            {studentResults.length}
                          </div>
                          <div>
                            <strong>Average Score:</strong><br />
                            {Math.round(studentResults.reduce((sum, result) => sum + result.percentage, 0) / studentResults.length)}%
                          </div>
                          <div>
                            <strong>Highest Score:</strong><br />
                            {Math.max(...studentResults.map(r => r.percentage))}%
                          </div>
                          <div>
                            <strong>Lowest Score:</strong><br />
                            {Math.min(...studentResults.map(r => r.percentage))}%
                          </div>
                          <div>
                            <strong>Pass Rate:</strong><br />
                            {Math.round((studentResults.filter(r => r.percentage >= 50).length / studentResults.length) * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                      {loading ? 'Loading results...' : 'No results found for this quiz code.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Sessions Management
    if (activeAdminSection === 'sessions') {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <LoadingError />
            <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setActiveAdminSection(null)} disabled={loading}>
              ← Back to Dashboard
            </button>
            
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Quiz Sessions</h2>
            
            {quizSessions.length > 0 ? (
              quizSessions.map((session, index) => (
                <div key={index} style={{
                  background: session.isActive ? '#e8f5e8' : '#f9f9f9',
                  padding: '20px',
                  margin: '15px 0',
                  borderRadius: '10px',
                  borderLeft: `4px solid ${session.isActive ? '#4CAF50' : '#ddd'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <h3>{session.name}</h3>
                      <p><strong>Code:</strong> {session.sessionId}</p>
                      <p><strong>Questions:</strong> {session.questions ? session.questions.length : 0}</p>
                      <p><strong>Status:</strong> {session.isActive ? '🟢 Active' : '🔴 Inactive'}</p>
                      <p><strong>Created:</strong> {new Date(session.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <button 
                        style={{...styles.button, margin: '5px'}} 
                        onClick={() => {
                          setCurrentSessionId(session.sessionId);
                          setActiveAdminSection('create');
                        }}
                        disabled={loading}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                {loading ? 'Loading sessions...' : 'No quiz sessions found. Create your first quiz session!'}
              </p>
            )}
          </div>
        </div>
      );
    }
    // Quiz Violations Section - ADD THIS ENTIRE SECTION
if (activeAdminSection === 'violations') {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <LoadingError />
        <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setActiveAdminSection(null)} disabled={loading}>
          ← Back to Dashboard
        </button>
        
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Quiz Violations</h2>
        
        <input
          type="text"
          placeholder="Enter quiz code to view violations"
          value={violationSessionCode}
          onChange={(e) => setViolationSessionCode(e.target.value.toUpperCase())}
          style={styles.input}
          disabled={loading}
        />
        
        <div style={{ marginTop: '30px' }}>
          {violationSessionCode && (
            <div>
              <h3>Violations for: {violationSessionCode}</h3>
              {quizViolations.length > 0 ? (
                <div>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    Total Violations: {quizViolations.length}
                  </p>
                  {quizViolations.map((violation, index) => (
                    <div key={index} style={styles.violationCard}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                        <div><strong>Name:</strong> {violation.studentName}</div>
                        <div><strong>Reg No:</strong> {violation.regNo}</div>
                        <div><strong>Department:</strong> {violation.department}</div>
                        <div><strong>Violation Type:</strong> {violation.violationType.replace('_', ' ')}</div>
                        <div><strong>Question:</strong> {violation.currentQuestion + 1}/{violation.totalQuestions}</div>
                        <div><strong>Time Left:</strong> {Math.floor(violation.timeLeft / 60)}:{(violation.timeLeft % 60).toString().padStart(2, '0')}</div>
                        <div><strong>Tab Switches:</strong> {violation.tabSwitchCount}</div>
                        <div><strong>Status:</strong> 
                          <span style={{
                            marginLeft: '5px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            background: violation.isResolved ? '#4CAF50' : '#ff9800',
                            color: 'white'
                          }}>
                            {violation.isResolved ? 'Resolved' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {!violation.isResolved && (
                          <>
                            <button
                              style={styles.resumeButton}
                              onClick={() => handleApproveResume(violation._id)}
                              disabled={loading}
                            >
                              🔄 Resume Quiz
                            </button>
                            <button
                              style={{...styles.resumeButton, background: 'linear-gradient(45deg, #4CAF50, #45a049)'}}
                              onClick={() => handleRestartStudentQuiz(violation)}
                              disabled={loading}
                            >
                              🎯 Approve Restart
                            </button>
                          </>
                        )}
                        <button
                          style={{...styles.resumeButton, background: 'linear-gradient(45deg, #2196F3, #1976D2)'}}
                          onClick={() => {
                            setSelectedViolation(violation);
                            setShowViolationDetails(true);
                          }}
                          disabled={loading}
                        >
                          👁️ View Details
                        </button>
                      </div>
                      
                      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                        <strong>Occurred:</strong> {new Date(violation.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                  {loading ? 'Loading violations...' : 'No violations found for this quiz code.'}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Violation Details Modal */}
        {showViolationDetails && selectedViolation && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              margin: '20px'
            }}>
              <h3>Violation Details</h3>
              <div style={{ marginBottom: '15px' }}>
                <strong>Student:</strong> {selectedViolation.studentName} ({selectedViolation.regNo})<br />
                <strong>Department:</strong> {selectedViolation.department}<br />
                <strong>Violation Type:</strong> {selectedViolation.violationType.replace('_', ' ')}<br />
                <strong>Current Question:</strong> {selectedViolation.currentQuestion + 1}<br />
                <strong>Time Remaining:</strong> {Math.floor(selectedViolation.timeLeft / 60)}:{(selectedViolation.timeLeft % 60).toString().padStart(2, '0')}<br />
                <strong>Tab Switch Count:</strong> {selectedViolation.tabSwitchCount}<br />
                <strong>Time Spent:</strong> {Math.floor(selectedViolation.timeSpent / 60)} minutes<br />
                <strong>Occurred:</strong> {new Date(selectedViolation.createdAt).toLocaleString()}
              </div>
              
              <h4>Current Answers:</h4>
              <div style={{ maxHeight: '200px', overflow: 'auto', background: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
                {selectedViolation.userAnswers.map((answer, index) => (
                  <div key={index} style={{ marginBottom: '5px' }}>
                    <strong>Q{index + 1}:</strong> {answer || 'Not answered'}
                  </div>
                ))}
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  style={styles.button}
                  onClick={() => {
                    setShowViolationDetails(false);
                    setSelectedViolation(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
  }

  // Student Panel
  if (currentView === 'student') {
    // UPDATED: Warning Banner with different messages based on tab switch count
    const warningBanner = showWarning && (
  <div style={styles.warningBanner}>
    {warningMessage}
  </div>
);


    // Code Entry View
    if (studentView === 'codeEntry') {
      return (
        <div style={styles.container}>
          {warningBanner}
          <div style={styles.card}>
            <LoadingError />
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setCurrentView('home')} disabled={loading}>
                ← Back to Home
              </button>
              <h1>Join Quiz</h1>
              <p style={{ color: '#666' }}>Enter the quiz code provided by your instructor</p>
            </div>
            
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <input
                type="text"
                placeholder="Enter Quiz Code"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                style={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinQuiz()}
                disabled={loading}
              />
              <div style={{ textAlign: 'center' }}>
                <button style={styles.button} onClick={handleJoinQuiz} disabled={loading}>
                  {loading ? 'Joining...' : 'Join Quiz'}
                </button>
              </div>
              
              <div style={{ marginTop: '30px', padding: '20px', background: '#f0f8ff', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Need Help?</h4>
                <p style={{ margin: '0', color: '#666' }}>
                  Enter the quiz code provided by your instructor to join the quiz session.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Student Information Form
    if (studentView === 'form') {
      return (
        <div style={styles.container}>
          {warningBanner}
          <div style={styles.card}>
            <LoadingError />
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <button style={{...styles.button, marginBottom: '20px'}} onClick={() => setStudentView('codeEntry')} disabled={loading}>
                ← Back
              </button>
              <h2>Student Information</h2>
              <p style={{ color: '#666' }}>Quiz: {currentQuiz?.name}</p>
              <p style={{ color: '#666' }}>Questions: {currentQuiz?.questions?.length || 0} | Time: 90 minutes</p>
            </div>
            
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <input
                type="text"
                placeholder="Full Name *"
                value={studentInfo.name}
                onChange={(e) => setStudentInfo({...studentInfo, name: e.target.value})}
                style={styles.input}
                disabled={loading}
              />
              
              <input
                type="text"
                placeholder="Roll number *"
                value={studentInfo.regNo}
                onChange={(e) => {
    const input = e.target.value;
    // Allow only digits 
    if (/^\d*$/.test(input)) {
      setStudentInfo({ ...studentInfo, regNo: input });
    }
  }}
                style={styles.input}
                disabled={loading}
              />
              
              <select
                value={studentInfo.department}
                onChange={(e) => setStudentInfo({...studentInfo, department: e.target.value})}
                style={styles.select}
                disabled={loading}
              >
                <option value="">Select Department *</option>
                <option value="CSE AIML">CSE-Artificial Intelligence and Machine Learning</option>
  <option value="Civil">Civil Engineering</option>
  <option value="CSE">Computer Science Engineering</option>
  <option value="CSBS">Computer Science and Business Systems</option>
    <option value="Data Science">Data Science</option>
  <option value="ECE">Electronics and Communication Engineering</option>
  <option value="EEE">Electrical and Electronics Engineering</option>
  <option value="IT">Information Technology</option>
  <option value="Mechatronics">Mechatronics</option>
  <option value="Mechanical">Mechanical Engineering</option>
    <option value="Tseda">TSEDA(Architecture, Design, Planning)</option>

  
              </select>
              
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button style={styles.button} onClick={startStudentQuiz} disabled={loading}>
                  {loading ? 'Starting...' : 'Start Quiz'}
                </button>
              </div>
              
              <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                <strong style={{ color: '#856404' }}>⚠️ Important Instructions:</strong>
                <ul style={{ margin: '10px 0', paddingLeft: '20px', color: '#856404' }}>
                  <li>Do not refresh, minimize, resize, or switch tabs during the quiz.</li>
    <li>Any attempt to switch tabs, copy content, or navigate away will result in immediate termination and auto-submission of the quiz.</li>
    <li>You are allotted 90 minutes to complete the quiz.</li>
    <li>All fields must be filled before starting the quiz.</li>
                </ul>
              </div>

{currentQuiz && currentQuiz.hasAudio && (
  <div style={{ marginTop: '15px', padding: '15px', background: '#e8f5e8', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
    <strong style={{ color: '#155724' }}>🎵 Audio Quiz Information:</strong>
    <ul style={{ margin: '10px 0', paddingLeft: '20px', color: '#155724' }}>
      <li>This quiz contains audio reference material</li>
      <li>Make sure your volume is at a comfortable level</li>
      <li>You can play, pause, and restart the audio anytime</li>
      <li>Audio will continue playing as you navigate between questions</li>
    </ul>
  </div>
)}



            </div>
          </div>
        </div>
      );
    }

    // Quiz Taking View
    if (studentView === 'quiz') {
      const currentQ = currentQuiz.questions[currentQuestion];
      const progress = ((currentQuestion + 1) / currentQuiz.questions.length) * 100;
      
      return (
        <div style={styles.container}>
          {warningBanner}
          <div style={styles.card}>
            <LoadingError />
            {/* Timer */}
            <div style={styles.timer}>
              ⏰ Time Remaining: {formatTime(timeLeft)}
            </div>
            
            {/* Progress Bar */}
            <div style={styles.progressBar}>
              <div style={styles.progressFill(progress)}></div>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3>Question {currentQuestion + 1} of {currentQuiz.questions.length}</h3>
              {/* UPDATED: Show tab switch warning */}
              {tabSwitchCount > 0 && (
                <div style={{ 
                  background: tabSwitchCount === 1 ? '#fff3cd' : '#f8d7da',
                  color: tabSwitchCount === 1 ? '#856404' : '#721c24',
                  padding: '10px',
                  borderRadius: '5px',
                  margin: '10px 0',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {tabSwitchCount === 1 
                    ? "⚠️ Warning: 1 tab switch detected. Next switch will auto-submit!"
                    : "❌ Multiple tab switches detected. Quiz will be submitted automatically."
                  }
                </div>
              )}
            </div>
            
            {/* Question */}
            <div style={{ ...styles.questionCard, userSelect: 'none' }}>
              <h3 style={{ marginBottom: '20px', color: '#333' }}>{currentQ.question}</h3>
              
              {/* Options */}
              <div>
                {Object.entries(currentQ.options).map(([key, value], index) => (
                  <div
                    key={key}
                    style={styles.option(userAnswers[currentQuestion] === key.toUpperCase())}
                    onClick={() => selectOption(index)}
                  >
                    <strong>{key.toUpperCase()})</strong> {value}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
              <button 
                style={{
                  ...styles.button,
                  opacity: currentQuestion === 0 ? 0.5 : 1,
                  cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer'
                }}
                onClick={previousQuestion}
                disabled={currentQuestion === 0 || loading}
              >
                ← Previous
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: '#666' }}>
                  Answered: {userAnswers.filter(a => a !== null).length}/{currentQuiz.questions.length}
                </span>
              </div>
              
              <button 
                style={styles.button}
                onClick={nextQuestion}
                disabled={
                  loading || (
                    currentQuestion === currentQuiz.questions.length - 1 &&
                    userAnswers.some((a) => a === null) &&
                    timeLeft > 0
                  )
                }
              >
                {currentQuestion === currentQuiz.questions.length - 1 ? 
                  (loading ? 'Submitting...' : 'Submit Quiz') : 
                  'Next →'
                }
              </button>
            </div>
            
            {/* Question Navigation */}
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <h4>Quick Navigation:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                {currentQuiz.questions.map((_, index) => (
                  <button
                    key={index}
                    style={{
                      ...styles.button,
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      padding: '0',
                      fontSize: '14px',
                      background: userAnswers[index] !== null 
                        ? 'linear-gradient(45deg, #4CAF50, #45a049)' 
                        : index === currentQuestion 
                          ? 'linear-gradient(45deg, #ff9800, #f57c00)'
                          : 'linear-gradient(45deg, #ddd, #bbb)',
                      color: userAnswers[index] !== null || index === currentQuestion ? 'white' : '#666'
                    }}
                    onClick={() => setCurrentQuestion(index)}
                    disabled={loading}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                🟢 Answered | 🟠 Current | ⚪ Not Answered
              </p>
            </div>
          </div>

{/* Reference Passages Navigation */}
{currentQuiz.passages && currentQuiz.passages.length > 0 && (
  <div style={{ marginTop: '20px', textAlign: 'center' }}>
    <h4 style={{ color: '#2196F3' }}>📚 Reference Passages:</h4>
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
      {currentQuiz.passages.map((passage, index) => (
        <button
          key={index}
          style={styles.passageButton}
          onClick={() => {
            setSelectedPassage(passage);
            setShowPassageModal(true);
          }}
          disabled={loading}
        >
          {passage.title}
        </button>
      ))}
    </div>
  </div>
)}
{/*REPLACE the entire audio player section in Quiz Taking View (around line 1060-1080)*/}
{/* Find this section and replace it completely:*/}

{/* Audio Player - FIXED VERSION */}
{/* Audio Player - COMPLETELY FIXED VERSION */}
{currentQuiz && currentQuiz.hasAudio && (
  <div style={{ 
    marginTop: '20px', 
    padding: '20px', 
    background: '#fff0f5', 
    borderRadius: '15px',
    border: '2px solid #e91e63',
    boxShadow: '0 4px 8px rgba(233, 30, 99, 0.1)'
  }}>
    <h4 style={{ 
      color: '#e91e63', 
      textAlign: 'center', 
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    }}>
      🎵 Audio Reference
      {isAudioPlaying && <span style={{ fontSize: '12px', color: '#4CAF50' }}>● PLAYING</span>}
    </h4>
    
    <div style={{ textAlign: 'center' }}>
      <audio 
        ref={audioRef => {
          if (audioRef && !audioRef.hasAttribute('data-initialized')) {
            audioRef.setAttribute('data-initialized', 'true');
            audioRef.preload = 'auto';
            audioRef.crossOrigin = 'anonymous';
            
            // Add event listeners
            const handlePlay = () => setIsAudioPlaying(true);
            const handlePause = () => setIsAudioPlaying(false);
            const handleEnded = () => setIsAudioPlaying(false);
            const handleError = (e) => {
              console.error('Audio error:', e.target.error);
            };
            const handleCanPlay = () => {
              console.log('Audio can play');
            };
            
            audioRef.addEventListener('play', handlePlay);
            audioRef.addEventListener('pause', handlePause);
            audioRef.addEventListener('ended', handleEnded);
            audioRef.addEventListener('error', handleError);
            audioRef.addEventListener('canplay', handleCanPlay);
          }
        }}
        controls 
        style={{ 
          width: '100%', 
          maxWidth: '500px',
          height: '40px',
          outline: 'none'
        }}
      >
        <source src={`${API_BASE_URL}/api/quiz-sessions/${currentQuiz.sessionId}/audio?cacheBust=${Date.now()}`} type="audio/mpeg" />
        <source src={`${API_BASE_URL}/api/quiz-sessions/${currentQuiz.sessionId}/audio?cacheBust=${Date.now()}`} type="audio/wav" />
        <source src={`${API_BASE_URL}/api/quiz-sessions/${currentQuiz.sessionId}/audio?cacheBust=${Date.now()}`} type="audio/ogg" />
        Your browser does not support the audio element.
      </audio>
      
      <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button
          style={{
            ...styles.audioButton,
            background: isAudioPlaying ? 'linear-gradient(45deg, #f44336, #da190b)' : 'linear-gradient(45deg, #4CAF50, #45a049)'
          }}
          onClick={() => {
            const audio = document.querySelector('audio');
            if (audio) {
              if (audio.paused) {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                  playPromise.then(() => {
                    console.log('Audio started playing');
                  }).catch(error => {
                    console.error('Play failed:', error);
                    // Fallback: reload the audio source
                    audio.load();
                    setTimeout(() => {
                      audio.play().catch(e => console.error('Retry play failed:', e));
                    }, 100);
                  });
                }
              } else {
                audio.pause();
              }
            }
          }}
        >
          {isAudioPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        
        <button
          style={styles.audioButton}
          onClick={() => {
            const audio = document.querySelector('audio');
            if (audio) {
              audio.currentTime = 0;
              audio.load(); // Reload to ensure fresh start
              if (!audio.paused) {
                setTimeout(() => {
                  audio.play().catch(e => console.error('Restart play error:', e));
                }, 100);
              }
            }
          }}
        >
          🔄 Restart
        </button>

        <button
          style={styles.audioButton}
          onClick={() => {
            const audio = document.querySelector('audio');
            if (audio) {
              // Force reload the audio
              const originalSrc = audio.src;
              audio.src = '';
              audio.load();
              audio.src = `${API_BASE_URL}/api/quiz-sessions/${currentQuiz.sessionId}/audio?reload=${Date.now()}`;
              audio.load();
              
              setTimeout(() => {
                if (audio.readyState >= 2) {
                  alert('Audio reloaded successfully! Try playing now.');
                } else {
                  alert('Audio is loading... Please wait a moment and try again.');
                }
              }, 500);
            }
          }}
        >
          🔄 Reload Audio
        </button>
      </div>
      
      <p style={{ fontSize: '12px', color: '#666', marginTop: '15px', fontStyle: 'italic' }}>
        🎧 You can listen to this audio reference while answering questions.<br/>
        The audio will continue playing as you navigate between questions.<br/>
        💡 <strong>Tip:</strong> If audio doesn't play, click "Reload Audio" and try again.
      </p>
    </div>
  </div>
)}

{/* Passage Modal */}
{showPassageModal && selectedPassage && (
  <div style={styles.passageModal}>
    <div style={styles.passageContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#2196F3', margin: 0 }}>📖 {selectedPassage.title}</h3>
        <button
          style={{
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
          onClick={() => {
            setShowPassageModal(false);
            setSelectedPassage(null);
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{
        padding: '20px',
        background: '#f9f9f9',
        borderRadius: '10px',
        lineHeight: '1.6',
        fontSize: '16px',
        color: '#333',
        whiteSpace: 'pre-wrap'
      }}>
        {selectedPassage.content}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          style={styles.button}
          onClick={() => {
            setShowPassageModal(false);
            setSelectedPassage(null);
          }}
        >
          Close Passage
        </button>
      </div>
    </div>
  </div>
)}

        </div>
      );
    }


    
    // Results View
    if (studentView === 'result') {
  const { scorePercentage } = calculateStudentResults(); // Only take percentage

 return (
  <div style={styles.container}>
    <div style={styles.card}>
      <div style={styles.resultCard}>
        <h2>🎉 Quiz Completed</h2>
        <div style={styles.scoreCircle(scorePercentage)}>
          {scorePercentage}%
        </div>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>
          Thank you for completing the quiz.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button style={styles.button} onClick={restartStudent}>
          Back to Home
        </button>
      </div>

     <div style={styles.footerBlack}>
  <div style={styles.footerColumn}>
    <div style={styles.footerHeading}>Developed By</div>
    <p style={styles.footerText}>
      Mathivathani E<br />
      Roshini M<br />
      Shanmathi N<br />
      Harini R<br />
      Sanchana R
    </p>
  </div>

  <div style={styles.verticalDivider}></div>

  <div style={styles.footerColumn}>
    <div style={styles.footerHeading}>Under the guidance of</div>
    <p style={styles.footerText}>
      Department of Information Technology<br />
      <strong style={{ color: '#f2eaeaff' }}>C.V. Nisha Angeline</strong>
    </p>
  </div>
</div>

    </div>
  </div>
);

}
    // Waiting for Admin View - ADD THIS SECTION
if (studentView === 'waitingForAdmin') {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <LoadingError />
        <div style={styles.waitingCard}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⏳</div>
          <h2 style={{ color: '#1976D2', marginBottom: '20px' }}>Quiz Suspended</h2>
          <p style={{ whiteSpace: 'pre-line', marginBottom: '30px', fontSize: '16px' }}>
            {suspensionMessage}
          </p>
          
          <div style={{ maxWidth: '420px', margin: '0 auto', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>Waiting for Instructor Approval</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>
              Once your instructor approves, click the button below to continue. No token needed.
            </p>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button style={styles.button} onClick={handleResumeQuiz} disabled={loading}>
                {loading ? 'Checking...' : 'Continue Quiz'}
              </button>
            </div>
          </div>
          
          <div style={{ marginTop: '30px' }}>
            <button 
              style={{...styles.button, background: 'linear-gradient(45deg, #666, #555)'}} 
              onClick={() => setCurrentView('home')}
              disabled={loading}
            >
              Exit to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
}
  return null;
};
export default IntegratedQuizApp;
