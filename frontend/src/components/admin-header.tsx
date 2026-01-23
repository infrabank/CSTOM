"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

export default function AdminHeader() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center relative bg-white z-50">
        <Link href="/">
          <Image
            src="/images/ci_21.jpg"
            alt="KRIHS 국토연구원"
            width={150}
            height={33}
            priority
          />
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex gap-6">
            <Link href="/contracts" className="text-black hover:text-gray-900 font-medium">사업 관리</Link>
            <Link href="/tasks" className="text-black hover:text-gray-900 font-medium">작업 관리</Link>
            <Link href="/events" className="text-black hover:text-gray-900 font-medium">변경/장애</Link>
            <Link href="/reports" className="text-black hover:text-gray-900 font-medium">보고서</Link>
            <Link href="/users" className="text-black hover:text-gray-900 font-medium">사용자</Link>
            <Link href="/equipments" className="text-black hover:text-gray-900 font-medium">장비 관리</Link>
          </nav>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <button 
            onClick={handleLogout} 
            className="text-black hover:text-red-600 transition-colors p-1" 
            title="로그아웃"
            aria-label="로그아웃"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
          </button>
        </div>

        <div className="md:hidden flex items-center gap-4">
          <button  
            onClick={handleLogout} 
            className="text-black hover:text-red-600 transition-colors p-1" 
            title="로그아웃"
            aria-label="로그아웃"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
          </button>
          <button 
            onClick={toggleMenu} 
            className="text-black hover:text-gray-900 p-1" 
            aria-label="메뉴"
            aria-expanded={isMenuOpen}
          >
             {isMenuOpen ? (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
               </svg>
             )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40" 
            onClick={closeMenu} 
            aria-hidden="true" 
          />
          <div className="absolute top-full left-0 right-0 bg-white border-b shadow-lg z-50 md:hidden animate-in slide-in-from-top-2 duration-200">
             <nav className="flex flex-col p-4 space-y-4">
              <Link href="/contracts" onClick={closeMenu} className="text-black hover:text-gray-900 font-medium px-2 py-1 hover:bg-gray-50 rounded">사업 관리</Link>
              <Link href="/tasks" onClick={closeMenu} className="text-black hover:text-gray-900 font-medium px-2 py-1 hover:bg-gray-50 rounded">작업 관리</Link>
              <Link href="/events" onClick={closeMenu} className="text-black hover:text-gray-900 font-medium px-2 py-1 hover:bg-gray-50 rounded">변경/장애</Link>
              <Link href="/reports" onClick={closeMenu} className="text-black hover:text-gray-900 font-medium px-2 py-1 hover:bg-gray-50 rounded">보고서</Link>
              <Link href="/users" onClick={closeMenu} className="text-black hover:text-gray-900 font-medium px-2 py-1 hover:bg-gray-50 rounded">사용자</Link>
              <Link href="/equipments" onClick={closeMenu} className="text-black hover:text-gray-900 font-medium px-2 py-1 hover:bg-gray-50 rounded">장비 관리</Link>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
