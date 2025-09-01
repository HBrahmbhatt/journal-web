import { useState } from "react";
import styles from './Login.module.css';

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      setMessage("You are logged in!");
    } else {
      setMessage("Please enter username and password.");
    }
  };

  return (
    <div className={styles.container}>
        <div className={styles.box}>
        <h1>Login Page</h1>
        <form onSubmit={handleSubmit}>
            <label>username</label>
            <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            />

            <label>password</label>
            <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            />

            <button type="submit">Login</button>
        </form>

        {message && <p className={styles.message}>{message}</p>}
        </div>
    </div>
  );
}
