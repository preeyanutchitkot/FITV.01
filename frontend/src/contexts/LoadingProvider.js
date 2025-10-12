import React, { createContext, useContext, useState } from "react";

const LoadingCtx = createContext(null);

export function LoadingProvider({ children }) {
  const [state, setState] = useState({ show: false, text: "กำลังโหลดข้อมูล..." });

  const showLoading = (text = "กำลังโหลดข้อมูล...") =>
    setState({ show: true, text });
  const hideLoading = () => setState(s => ({ ...s, show: false }));

  // ห่อ async ให้อัตโนมัติ: withLoading(() => fetch(...))
  const withLoading = async (fnOrPromise, text) => {
    showLoading(text);
    try {
      if (typeof fnOrPromise === "function") return await fnOrPromise();
      return await fnOrPromise; // ถ้าส่งเป็น promise มาเลย
    } finally {
      hideLoading();
    } 
  };

  return (
    <LoadingCtx.Provider value={{ ...state, showLoading, hideLoading, withLoading }}>
      {children}

      {/* Global overlay (แสดงครั้งเดียวทั้งแอป) */}
      {state.show && (
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>{state.text}</p>
        </div>
      )}
    </LoadingCtx.Provider>
  );
}

export const useLoading = () => {
  const ctx = useContext(LoadingCtx);
  if (!ctx) throw new Error("useLoading must be used within <LoadingProvider>");
  return ctx;
};
