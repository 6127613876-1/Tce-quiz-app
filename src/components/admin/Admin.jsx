import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { styles } from '../common/styles';
import LoadingError from '../common/LoadingError';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [activeAdminSection, setActiveAdminSection] = useState(null);
  const [quizSessions, setQuizSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [entryMethod, setEntryMethod] = useState('manual');
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [csvErrors, setCsvErrors] = useState([]);
  const [csvPreview, setCsvPreview] = useState([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [passageTitle, setPassageTitle] = useState('');
  const [passageText, setPassageText] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [resultSessionCode, setResultSessionCode] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [resultFilter, setResultFilter] = useState('all');
  const [violationSessionCode, setViolationSessionCode] = useState('');
  const [quizViolations, setQuizViolations] = useState([]);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showViolationDetails, setShowViolationDetails] = useState(false);

  const API_BASE_URL = 'https://tce-quiz-app.onrender.com';

  
  const apiCall = async (endpoint, method = 'GET', data = null) => {
    setLoading(true);
    setError('');
    try {
      const config = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (data) config.body = JSON.stringify(data);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

  const handleAdminLogin = async () => {
    try {
      const response = await apiCall('/api/admin/login', 'POST', { adminCode });
      if (response.success) {
        setUser({ role: 'admin' }); // Set user state
        setIsAdminAuthenticated(true);
        await loadQuizSessions();
      } else {
        toast.error('Invalid admin code!');
      }
    } catch (error) {
      toast.error('Login failed: ' + error.message);
    }
  };

  const loadQuizSessions = async () => {
    try {
      const sessions = await apiCall('/api/quiz-sessions');
      setQuizSessions(sessions);
    } catch (error) {
      toast.error('Failed to load quiz sessions: ' + error.message);
    }
  };

  const handleCreateSession = async () => {
    const sessionName = prompt('Enter Quiz Session Name:');
    if (sessionName) {
      try {
        const newSession = await apiCall('/api/quiz-sessions', 'POST', { name: sessionName, createdBy: 'admin' });
        setCurrentSessionId(newSession.sessionId);
        setActiveAdminSection('create');
        await loadQuizSessions();
        toast.success(`Session created with ID: ${newSession.sessionId}`);
      } catch (error) {
        toast.error('Failed to create session: ' + error.message);
      }
    }
  };

  const handleAddQuestion = async () => {
    if (questionText && optionA && optionB && optionC && optionD && correctOption && currentSessionId) {
      try {
        const questionData = {
          question: questionText,
          options: { a: optionA, b: optionB, c: optionC, d: optionD },
          correct: correctOption,
        };
        await apiCall(`/api/quiz-sessions/${currentSessionId}/questions`, 'POST', questionData);
        setQuestionText('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setCorrectOption('');
        await loadQuizSessions();
        toast.success('Question added successfully!');
      } catch (error) {
        toast.error('Failed to add question: ' + error.message);
      }
    } else {
      toast.info('Please fill all fields!');
    }
  };

  const parseCsvFile = (file) => {
    import('papaparse').then((Papa) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            const errorMessages = results.errors.map((e) => `Row ${e.row + 1}: ${e.message}`);
            setCsvErrors(errorMessages);
            toast.error('CSV parsing errors found. Check the preview section.');
            return;
          }
          const requiredColumns = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer'];
          const csvColumns = Object.keys(results.data[0] || {});
          const missingColumns = requiredColumns.filter((col) => !csvColumns.includes(col));
          if (missingColumns.length > 0) {
            setCsvErrors([`Missing required columns: ${missingColumns.join(', ')}`]);
            toast.error(`Missing required columns: ${missingColumns.join(', ')}\n\nRequired columns: ${requiredColumns.join(', ')}`);
            return;
          }
          const questions = results.data.map((row, index) => {
            const correctAnswer = row['Correct Answer']?.toString().trim().toUpperCase();
            return {
              question: row['Question']?.toString().trim(),
              options: {
                a: row['Option A']?.toString().trim(),
                b: row['Option B']?.toString().trim(),
                c: row['Option C']?.toString().trim(),
                d: row['Option D']?.toString().trim(),
              },
              correct: correctAnswer,
              rowIndex: index + 2,
            };
          });
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
          toast.error('Error reading CSV file: ' + error.message);
        },
      });
    });
  };

  const handleCsvUpload = async () => {
    if (!csvPreview.length || !currentSessionId) {
      toast.error('No questions to upload or session not selected');
      return;
    }
    if (csvErrors.length > 0) {
      toast.error('Please fix the errors before uploading');
      return;
    }
    try {
      await apiCall(`/api/quiz-sessions/${currentSessionId}/questions/csv`, 'POST', { questions: csvPreview });
      setCsvFile(null);
      setCsvPreview([]);
      setShowCsvPreview(false);
      setCsvErrors([]);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      await loadQuizSessions();
      toast.success(`Successfully uploaded ${csvPreview.length} questions!`);
    } catch (error) {
      toast.error('Failed to upload CSV questions: ' + error.message);
    }
  };

  const clearCsvUpload = () => {
    setCsvFile(null);
    setCsvPreview([]);
    setShowCsvPreview(false);
    setCsvErrors([]);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const handleAddPassage = async () => {
    if (!passageTitle.trim() || !passageText.trim() || !currentSessionId) {
      toast.info('Please fill in both title and passage text!');
      return;
    }
    try {
      const passageData = { title: passageTitle.trim(), content: passageText.trim() };
      await apiCall(`/api/quiz-sessions/${currentSessionId}/passages`, 'POST', passageData);
      setPassageTitle('');
      setPassageText('');
      await loadQuizSessions();
      toast.success('Passage added successfully!');
    } catch (error) {
      toast.error('Failed to add passage: ' + error.message);
    }
  };

  const handleAddAudio = async () => {
    if (!audioFile) {
      toast.info('Please select an audio file first!');
      return;
    }
    if (!currentSessionId) {
      toast.info('Please create or select a quiz session first!');
      return;
    }
    const formData = new FormData();
    formData.append('audio', audioFile);
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/quiz-sessions/${currentSessionId}/audio`, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        toast.success('Audio uploaded successfully!');
        setAudioFile(null);
        setAudioUrl('');
        const fileInput = document.querySelector('input[type="file"][accept="audio/*"]');
        if (fileInput) fileInput.value = '';
        await loadQuizSessions();
      } else {
        const error = await response.text();
        toast.error('Failed to upload audio: ' + error);
      }
    } catch (error) {
      toast.error('Failed to upload audio: ' + error.message);
    }
  };

  const handleStartQuiz = async (sessionId) => {
    try {
      await apiCall(`/api/quiz-sessions/${sessionId}/start`, 'PUT');
      await loadQuizSessions();
      toast.info(`Quiz Started! Students can join using code: ${sessionId}`);
    } catch (error) {
      toast.error('Failed to start quiz: ' + error.message);
    }
  };

  const handleEndQuiz = async (sessionId) => {
    try {
      await apiCall(`/api/quiz-sessions/${sessionId}/end`, 'PUT');
      await loadQuizSessions();
      toast.info('Quiz Ended!');
    } catch (error) {
      toast.error('Failed to end quiz: ' + error.message);
    }
  };

  const handleGenerateLink = (sessionId) => {
    const currentSession = quizSessions.find((s) => s.sessionId === sessionId);
    if (currentSession && currentSession.questions.length > 0) {
      toast.info(`Quiz Code: ${sessionId}\nShare this code with students to join the quiz.`);
    } else {
      toast.info('Please add at least one question before generating the code.');
    }
  };

  const loadSessionResults = async (sessionId) => {
    try {
      const results = await apiCall(`/api/quiz-results/${sessionId}`);
      setStudentResults(results);
    } catch (error) {
      toast.error('Failed to load results: ' + error.message);
    }
  };

  const handleExportCSV = () => {
    if (!resultSessionCode) {
      toast.info('Please enter a quiz code first!');
      return;
    }
    if (studentResults.length === 0) {
      toast.error('No results found to export!');
      return;
    }
    const currentSession = quizSessions.find((s) => s.sessionId === resultSessionCode);
    const sessionName = currentSession ? currentSession.name : resultSessionCode;
    const filename = `Quiz_Results_${sessionName}_${resultSessionCode}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(studentResults, filename);
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export!');
      return;
    }
    const headers = [
      'Student Name',
      'Registration Number',
      'Department',
      'Score',
      'Total Questions',
      'Percentage',
      'Grade',
      'Submission Date',
      'Submission Time',
    ];
    const csvContent = [
      headers.join(','),
      ...data.map((result) => {
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
          submissionDate.toLocaleTimeString(),
        ].join(',');
      }),
    ].join('\n');
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

  const getGradeFromPercentage = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const loadQuizViolations = async (sessionId) => {
    try {
      setLoading(true);
      const violations = await apiCall(`/api/quiz-violations/${sessionId}`);
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
      toast.error('Failed to load violations: ' + error.message);
    }
  };

  const handleApproveResume = async (violationId) => {
    try {
      const response = await apiCall(`/api/quiz-violations/${violationId}/resume`, 'POST');
      if (response && response.success) {
        toast.success('Resume approved. The student can now continue the quiz.');
      } else {
        toast.success(response?.message || 'Resume approved.');
      }
      if (violationSessionCode) {
        await loadQuizViolations(violationSessionCode);
      }
    } catch (error) {
      toast.error('Failed to approve resume: ' + error.message);
    }
  };

  const handleRestartStudentQuiz = async (violation) => {
    const confirmRestart = window.confirm(
      `Are you sure you want to restart the quiz for ${violation.studentName} (${violation.regNo})?\n\nThis will:\n\u2022 Allow them to restart from question 1\n\u2022 Give them full time allocation\n\u2022 Reset their violation count\n\u2022 Mark this violation as resolved`
    );
    if (!confirmRestart) return;
    try {
      const response = await apiCall(`/api/quiz-violations/${violation._id}/restart`, 'POST', {
        adminAction: true,
        restartReason: 'Admin approved restart due to violations',
      });
      if (response.success) {
        toast.info(`Quiz restart approved for ${violation.studentName}! The student can restart without a token.`);
        if (violationSessionCode) {
          await loadQuizViolations(violationSessionCode);
        }
      }
    } catch (error) {
      toast.error('Failed to approve quiz restart: ' + error.message);
    }
  };

  useEffect(() => {
    if (resultSessionCode && activeAdminSection === 'results') {
      loadSessionResults(resultSessionCode);
    }
  }, [resultSessionCode, activeAdminSection]);

  useEffect(() => {
    if (violationSessionCode && activeAdminSection === 'violations') {
      loadQuizViolations(violationSessionCode);
    }
  }, [violationSessionCode, activeAdminSection]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      setIsAdminAuthenticated(true);
      loadQuizSessions();
    }
  }, [user]);

  if (!isAdminAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <ToastContainer />
          <LoadingError loading={loading} error={error} />
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
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

  if (!activeAdminSection) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <ToastContainer />
          <LoadingError loading={loading} error={error} />
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1>Admin Dashboard</h1>
            <p style={{ color: '#666' }}>Total Sessions: {quizSessions.length}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📝</div>
              <h3>Create Quiz</h3>
              <button style={styles.button} onClick={handleCreateSession} disabled={loading}>
                Create
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
              <h3>View Results</h3>
              <button style={styles.button} onClick={() => setActiveAdminSection('results')} disabled={loading}>
                View
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
              <h3>Quiz Sessions</h3>
              <button style={styles.button} onClick={() => setActiveAdminSection('sessions')} disabled={loading}>
                Manage
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: '30px', border: '2px solid #ddd', borderRadius: '15px', minWidth: '200px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
              <h3>Quiz Violations</h3>
              <button style={styles.button} onClick={() => setActiveAdminSection('violations')} disabled={loading}>
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeAdminSection === 'create') {
    const currentSession = quizSessions.find((s) => s.sessionId === currentSessionId);
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <ToastContainer />
          <LoadingError loading={loading} error={error} />
          <button style={{ ...styles.button, marginBottom: '20px' }} onClick={() => setActiveAdminSection(null)} disabled={loading}>
            ← Back to Dashboard
          </button>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2>Create Quiz: {currentSession?.name}</h2>
            <p style={{ color: '#666', fontSize: '18px' }}>
              Quiz Code: <strong>{currentSessionId}</strong>
            </p>
          </div>
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
                  padding: '10px 20px',
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
                  padding: '10px 20px',
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
                  padding: '10px 20px',
                }}
                onClick={() => setEntryMethod('comprehension')}
                disabled={loading}
              >
                📖 Comprehension
              </button>
              <button
                style={{
                  ...styles.button,
                  background: entryMethod === 'audio' ? 'linear-gradient(45deg, #667eea, #764ba2)' : 'transparent',
                  color: entryMethod === 'audio' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '20px',
                  margin: '0 5px',
                  padding: '10px 20px',
                }}
                onClick={() => setEntryMethod('audio')}
                disabled={loading}
              >
                🎵 Audio Upload
              </button>
            </div>
          </div>

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

          {entryMethod === 'csv' && (
            <div style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '15px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📊</div>
                <h3 style={{ color: '#667eea' }}>Upload Questions via CSV</h3>
              </div>
              <input type="file" accept=".csv" onChange={(e) => parseCsvFile(e.target.files[0])} style={styles.input} />
              {csvErrors.length > 0 && (
                <div style={{ color: 'red' }}>
                  <h4>CSV Errors:</h4>
                  <ul>
                    {csvErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {showCsvPreview && (
                <div>
                  <h4>CSV Preview:</h4>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Question</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px' }}>A</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px' }}>B</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px' }}>C</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px' }}>D</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Correct</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((q, index) => (
                          <tr key={index}>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{q.question}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{q.options.a}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{q.options.b}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{q.options.c}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{q.options.d}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{q.correct}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button style={styles.button} onClick={handleCsvUpload} disabled={loading || csvErrors.length > 0}>
                      {loading ? 'Uploading...' : 'Upload CSV'}
                    </button>
                    <button style={{ ...styles.button, background: 'grey' }} onClick={clearCsvUpload} disabled={loading}>
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {entryMethod === 'comprehension' && (
            <div style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '15px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📖</div>
                <h3 style={{ color: '#667eea' }}>Add Comprehension Passage</h3>
              </div>
              <input
                type="text"
                value={passageTitle}
                onChange={(e) => setPassageTitle(e.target.value)}
                placeholder="Passage Title"
                style={styles.input}
                disabled={loading}
              />
              <textarea
                value={passageText}
                onChange={(e) => setPassageText(e.target.value)}
                placeholder="Passage Text"
                style={{ ...styles.input, height: '200px' }}
                disabled={loading}
              />
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <button style={styles.button} onClick={handleAddPassage} disabled={loading}>
                  {loading ? 'Adding...' : '➕ Add Passage'}
                </button>
              </div>
            </div>
          )}

          {entryMethod === 'audio' && (
            <div style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '15px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎵</div>
                <h3 style={{ color: '#667eea' }}>Upload Audio File</h3>
              </div>
              <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files[0])} style={styles.input} />
              {audioUrl && <audio src={audioUrl} controls style={{ width: '100%' }} />} 
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <button style={styles.button} onClick={handleAddAudio} disabled={loading}>
                  {loading ? 'Uploading...' : '➕ Upload Audio'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeAdminSection === 'results') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <ToastContainer />
          <LoadingError loading={loading} error={error} />
          <button style={{ ...styles.button, marginBottom: '20px' }} onClick={() => setActiveAdminSection(null)} disabled={loading}>
            ← Back to Dashboard
          </button>
          <div style={styles.resultsHeader}>
            <h2>Quiz Results</h2>
            <button style={styles.csvButton} onClick={handleExportCSV} disabled={loading}>
              Export to CSV
            </button>
          </div>
          <input
            type="text"
            placeholder="Enter Quiz Code to see results"
            value={resultSessionCode}
            onChange={(e) => setResultSessionCode(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} style={styles.select}>
            <option value="all">All Results</option>
            <option value="pass">Passed</option>
            <option value="fail">Failed</option>
          </select>
          <div>
            {studentResults
              .filter((result) => {
                if (resultFilter === 'pass') return result.percentage >= 50;
                if (resultFilter === 'fail') return result.percentage < 50;
                return true;
              })
              .map((result, index) => (
                <div key={index} style={styles.resultCard}>
                  <p>
                    <strong>{result.studentName}</strong> ({result.regNo} - {result.department})
                  </p>
                  <p>
                    Score: {result.score}/{result.totalQuestions} ({result.percentage}% - Grade: {getGradeFromPercentage(result.percentage)})
                  </p>
                  <p>Submitted at: {new Date(result.submittedAt).toLocaleString()}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeAdminSection === 'sessions') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <ToastContainer />
          <LoadingError loading={loading} error={error} />
          <button style={{ ...styles.button, marginBottom: '20px' }} onClick={() => setActiveAdminSection(null)} disabled={loading}>
            ← Back to Dashboard
          </button>
          <h2>Quiz Sessions</h2>
          <div>
            {quizSessions.map((session) => (
              <div key={session.sessionId} style={styles.questionCard}>
                <h3>{session.name}</h3>
                <p>ID: {session.sessionId}</p>
                <p>Status: {session.isActive ? 'Active' : 'Inactive'}</p>
                <p>Questions: {session.questions.length}</p>
                <button style={styles.button} onClick={() => handleStartQuiz(session.sessionId)} disabled={loading || session.isActive}>
                  Start
                </button>
                <button style={styles.button} onClick={() => handleEndQuiz(session.sessionId)} disabled={loading || !session.isActive}>
                  End
                </button>
                <button style={styles.button} onClick={() => handleGenerateLink(session.sessionId)} disabled={loading}>
                  Link
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeAdminSection === 'violations') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <ToastContainer />
          <LoadingError loading={loading} error={error} />
          <button style={{ ...styles.button, marginBottom: '20px' }} onClick={() => setActiveAdminSection(null)} disabled={loading}>
            ← Back to Dashboard
          </button>
          <h2>Quiz Violations</h2>
          <input
            type="text"
            placeholder="Enter Quiz Code to see violations"
            value={violationSessionCode}
            onChange={(e) => setViolationSessionCode(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <div>
            {quizViolations.map((violation) => (
              <div key={violation._id} style={styles.violationCard}>
                <p>
                  <strong>{violation.studentName}</strong> ({violation.regNo})
                </p>
                <p>
                  Violation: {violation.violationType}
                </p>
                <p>
                  Time: {new Date(violation.timestamp).toLocaleString()}
                </p>
                <button
                  style={styles.resumeButton}
                  onClick={() => {
                    setSelectedViolation(violation);
                    setShowViolationDetails(true);
                  }}
                >
                  Details
                </button>
                <button style={styles.resumeButton} onClick={() => handleApproveResume(violation._id)} disabled={loading}>
                  Approve Resume
                </button>
                <button style={styles.resumeButton} onClick={() => handleRestartStudentQuiz(violation)} disabled={loading}>
                  Restart Quiz
                </button>
              </div>
            ))}
          </div>
          {showViolationDetails && selectedViolation && (
            <div style={styles.passageModal}>
              <div style={styles.passageContent}>
                <button onClick={() => setShowViolationDetails(false)} style={{ float: 'right' }}>
                  Close
                </button>
                <h3>Violation Details</h3>
                <p>
                  <strong>Student:</strong> {selectedViolation.studentName} ({selectedViolation.regNo})
                </p>
                <p>
                  <strong>Violation:</strong> {selectedViolation.violationType}
                </p>
                <p>
                  <strong>Time:</strong> {new Date(selectedViolation.timestamp).toLocaleString()}
                </p>
                <p>
                  <strong>Tab Switches:</strong> {selectedViolation.tabSwitchCount}
                </p>
                <p>
                  <strong>Time Left:</strong> {Math.floor(selectedViolation.timeLeft / 60)}m {selectedViolation.timeLeft % 60}s
                </p>
                <h4>Answers:</h4>
                <ul>
                  {selectedViolation.userAnswers.map((answer, index) => (
                    <li key={index}>
                      Q{index + 1}: {answer || 'No Answer'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default Admin;