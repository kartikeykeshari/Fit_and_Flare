import { useState, useContext } from "react";
import { loginUser } from "../api/authApi";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    emailOrPhone: "",
    password: "",
    otp: "",
  });

  const [needOtp, setNeedOtp] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      const res = await loginUser(form);

      if (res.data.needOtp) {
        setNeedOtp(true);
        alert("OTP sent! Please enter OTP to continue.");
        return;
      }

      login(res.data.token, res.data.user);
      alert("Login successful!");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div>
      <h2>Login</h2>

      <input
        name="emailOrPhone"
        placeholder="Email or Phone"
        onChange={handleChange}
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
      />

      {needOtp && (
        <input
          name="otp"
          placeholder="OTP"
          onChange={handleChange}
        />
      )}

      <button onClick={handleSubmit}>
        {needOtp ? "Verify OTP & Login" : "Login"}
      </button>
    </div>
  );
}
