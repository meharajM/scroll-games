import { useEffect, useState } from 'react';
import GameContainer from './components/GameContainer/GameContainer'
import './App.css';
import UserAuth, { auth } from './components/UserAuth/UserAuth';
const App = () => {
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  useEffect(() => {
    auth.onAuthStateChanged(user => {
      if (user) {
        // User is signed in
        onLoginComplete();
      }
      //  else {
      //   // No user is signed in
      //   onShowLogin();
      // }
    });
  }, [])
  const onShowLogin = () => {
    setShowLoginScreen(true);
  }
  const onLoginComplete = () => {
    setShowLoginScreen(false);
  }
  return <div className='app'>
    <GameContainer key={"game-container"} onShowLogin={onShowLogin}/>
    {showLoginScreen && 
      <div className='game-container-overlay'>
        <UserAuth onLoginComplete={onLoginComplete}/>
      </div>
    }
  </div>
}
export default App;