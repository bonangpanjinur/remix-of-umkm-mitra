import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ShoppingBag, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements - Village Vibe */}
      <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 bg-orange-50 rounded-full blur-3xl opacity-50" />
      
      {/* Village Icons Scattered */}
      <div className="absolute top-20 left-10 text-green-600/10 animate-bounce" style={{ animationDuration: '3s' }}>
        <MapPin size={48} />
      </div>
      <div className="absolute bottom-20 right-10 text-orange-600/10 animate-bounce" style={{ animationDuration: '4s' }}>
        <ShoppingBag size={56} />
      </div>

      <div className="max-w-md w-full text-center z-10">
        {/* Illustration Area */}
        <div className="relative mb-8 flex justify-center">
          <div className="w-64 h-64 bg-white rounded-full shadow-xl border-8 border-white flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-green-50 to-green-100/50" />
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-8xl font-black text-green-700/20">404</span>
              <div className="mt-[-20px] flex gap-2">
                <div className="w-12 h-16 bg-orange-400 rounded-t-lg shadow-md flex items-center justify-center text-white font-bold">
                  📦
                </div>
                <div className="w-14 h-20 bg-green-600 rounded-t-lg shadow-md flex items-center justify-center text-white text-xl">
                  🏠
                </div>
                <div className="w-12 h-14 bg-yellow-500 rounded-t-lg shadow-md flex items-center justify-center text-white font-bold">
                  🧺
                </div>
              </div>
            </div>
          </div>
          {/* Floating Leaves */}
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white animate-pulse">
            🌿
          </div>
          <div className="absolute -bottom-2 -left-4 w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white animate-pulse" style={{ animationDelay: '1s' }}>
            🍎
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Waduh, Halamannya Hilang!
        </h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Sepertinya Anda tersesat di jalan setapak desa. Halaman yang Anda cari tidak dapat ditemukan di <span className="font-mono bg-slate-100 px-1 rounded text-sm">{location.pathname}</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-green-600 hover:bg-green-700 text-white gap-2 px-8 py-6 rounded-2xl shadow-lg shadow-green-200 transition-all hover:scale-105">
            <Link to="/">
              <Home size={20} />
              Kembali ke Beranda
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="border-slate-200 text-slate-600 gap-2 px-8 py-6 rounded-2xl hover:bg-slate-50 transition-all">
            <Link to="/products">
              <ShoppingBag size={20} />
              Lihat Produk Desa
            </Link>
          </Button>
        </div>

        {/* Footer Text */}
        <p className="mt-12 text-sm text-slate-400 flex items-center justify-center gap-1">
          <ArrowLeft size={14} />
          Coba periksa kembali alamat URL Anda
        </p>
      </div>

      {/* Grass/Field Decoration at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-4 flex items-end justify-around overflow-hidden opacity-20 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="w-4 h-8 bg-green-600 rounded-t-full transform translate-y-2" style={{ height: `${Math.random() * 20 + 10}px` }} />
        ))}
      </div>
    </div>
  );
};

export default NotFound;
