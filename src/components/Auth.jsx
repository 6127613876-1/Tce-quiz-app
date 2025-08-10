import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { styles } from './common/styles';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (parsedUser.role === "student") {
        navigate("/student", { replace: true });
      }
    }
  }, [navigate]);

  const API_BASE_URL = 'https://tce-quiz-app.onrender.com';

  const determineRoleFromEmail = (email) => {
    const domain = email.toLowerCase().split('@')[1];
    const facultyDomains = [
      'faculty.college.edu',
      'admin.college.edu',
      'staff.college.edu',
      'instructor.college.edu',
    ];
    return facultyDomains.includes(domain) ? 'admin' : 'student';
  };

  const apiCall = async (endpoint, method = 'GET', data = null) => {
    setLoading(true);
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
      console.error('API Error:', error);
      throw error;
    }
  };

  const handleUserLogin = async () => {
    if (!userEmail || !userPassword) {
      toast.info('Please enter both email and password');
      return;
    }
    try {
      const response = await apiCall('/api/user/login', 'POST', {
        email: userEmail,
        password: userPassword,
      });

      if (response.success && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);

        // Navigate based on role
        if (response.user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/student', { replace: true });
        }
      } else {
        toast.error('Invalid login credentials.');
      }
    } catch (error) {
      toast.error('Login failed: ' + error.message);
    }
  };

  const handleUserRegistration = async () => {
    if (!registrationData.name || !registrationData.email || !registrationData.password) {
      setRegistrationError('Please fill all required fields');
      return;
    }
    if (registrationData.password !== registrationData.confirmPassword) {
      setRegistrationError('Passwords do not match');
      return;
    }

    const role = determineRoleFromEmail(registrationData.email);
    try {
      const response = await apiCall('/api/user/register', 'POST', {
        name: registrationData.name,
        email: registrationData.email,
        password: registrationData.password,
        role,
      });

      if (response.success) {
        toast.success(`Registration successful as ${role === 'admin' ? 'Faculty' : 'Student'}! Please login.`);
        setShowRegistration(false);
        setRegistrationData({ name: '', email: '', password: '', confirmPassword: '' });
        setRegistrationError('');
      }
    } catch (error) {
      setRegistrationError('Registration failed: ' + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <ToastContainer />
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img
            src="/logo.png"
            alt="TCE Logo"
            style={{ maxWidth: '120px', height: 'auto', marginBottom: '10px' }}
          />
          <h1 style={{ fontSize: '2rem', color: '#800000', fontWeight: 'bold', margin: '10px 0' }}>
            Thiagarajar College of Engineering
          </h1>
          <h2 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '10px' }}>
            Department of English
          </h2>
          <h3 style={{ fontSize: '1.2rem', color: '#555', marginBottom: '20px' }}>
            First Year Diagnostic Test - 2025
          </h3>
        </div>

        {/* Login Form */}
        {!showRegistration ? (
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
                style={{ ...styles.button, background: 'linear-gradient(45deg, #4CAF50, #45a049)' }}
                onClick={() => setShowRegistration(true)}
                disabled={loading}
              >
                Register Here
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            {registrationError && <div style={styles.errorMessage}>{registrationError}</div>}
            <input
              type="text"
              placeholder="Full Name *"
              value={registrationData.name}
              onChange={(e) => setRegistrationData({ ...registrationData, name: e.target.value })}
              style={styles.input}
              disabled={loading}
            />
            <input
              type="email"
              placeholder="Email Address *"
              value={registrationData.email}
              onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
              style={styles.input}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password *"
              value={registrationData.password}
              onChange={(e) => setRegistrationData({ ...registrationData, password: e.target.value })}
              style={styles.input}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Confirm Password *"
              value={registrationData.confirmPassword}
              onChange={(e) => setRegistrationData({ ...registrationData, confirmPassword: e.target.value })}
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
                style={{ ...styles.button, background: 'linear-gradient(45deg, #667eea, #764ba2)' }}
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
};

export default Auth;
