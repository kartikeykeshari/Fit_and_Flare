import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { verifyOtp } from "../api/authApi";

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const emailOrPhone = state?.emailOrPhone;

  const [code, setCode] = useState("");

  const handleVerify = async () => {
    try {
      const res = await verifyOtp({ emailOrPhone, code });
      alert(res.data.message);
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <div>
      <h2>Verify OTP</h2>
      <p>Sent to: {emailOrPhone}</p>

      <input
        placeholder="Enter OTP"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button onClick={handleVerify}>Verify</button>
    </div>
  );
}
