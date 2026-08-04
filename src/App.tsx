import { Route, Routes, useLocation } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Toaster from "@/components/Toaster";
import HomePage from "@/pages/HomePage";
import EditorPage from "@/pages/EditorPage";
import GuidePage from "@/pages/GuidePage";
import GalleryPage from "@/pages/GalleryPage";

export default function App() {
  const { pathname } = useLocation();
  const isEditor = pathname.startsWith("/editor");

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-bg-0 text-text-1">
        {!isEditor && <Navbar />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
        </Routes>
        {!isEditor && <Footer />}
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
