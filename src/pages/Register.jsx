import { useState } from "react";
import { registerUser } from "../api/authApi";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    otpMethod: "email",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await registerUser(form);
      alert(res.data.message);
      navigate("/verify-otp", { state: { emailOrPhone: form.email } });
    } catch (err) {
      alert(err.response?.data?.message || "Error occurred");
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        
        <input name="name" placeholder="Name" onChange={handleChange} />

        <input name="email" placeholder="Email" onChange={handleChange} />

        <input name="phone" placeholder="Phone" onChange={handleChange} />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />

        <select name="otpMethod" onChange={handleChange}>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
        </select>

        <button>Register</button>
      </form>
    </div>
  );
}
