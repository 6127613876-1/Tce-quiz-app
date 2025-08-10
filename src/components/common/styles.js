
export const styles = {
  container: {
    minHeight: '100vh',
    backgroundImage: 'url("/img.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
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
  },
  card: {
    maxWidth: '600px',
    margin: '0 auto',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(8px)',
    borderRadius: '40px 10px',
    padding: '40px 30px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
    border: '2px solid rgba(255,255,255,0.3)',
    transition: 'all 0.3s ease'
  },
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
    opacity: 1
  },
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
  },
  footerBlack: {
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
