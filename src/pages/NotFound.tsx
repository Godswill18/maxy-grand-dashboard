import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, ArrowLeft, Bell, Clock, Users, Star } from "lucide-react";

const NotFoundHotelDoor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [doorOpen, setDoorOpen] = useState(false);

  useEffect(() => {
    console.error("404 Error: Guest attempted to access non-existent room:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200">
      {/* Hotel wallpaper pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, #92400e 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="max-w-6xl w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hotel Door Section */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Door frame */}
                <div className="relative aspect-[0.6/1] max-h-[600px] mx-auto">
                  {/* Door */}
                  <div
                    className="relative h-full bg-gradient-to-b from-amber-800 via-amber-900 to-amber-950 rounded-lg shadow-2xl transition-transform duration-700 ease-in-out origin-left"
                    style={{
                      transform: doorOpen ? 'perspective(1200px) rotateY(-45deg)' : 'perspective(1200px) rotateY(0deg)',
                    }}
                  >
                    {/* Door panels */}
                    <div className="absolute inset-4 border-4 border-amber-700/50 rounded">
                      <div className="absolute inset-0 flex flex-col">
                        {/* Top panel */}
                        <div className="flex-1 border-b-2 border-amber-700/50 relative overflow-hidden">
                          <div className="absolute inset-2 border-2 border-amber-700/30 rounded" />
                        </div>
                        {/* Bottom panel */}
                        <div className="flex-1 relative overflow-hidden">
                          <div className="absolute inset-2 border-2 border-amber-700/30 rounded" />
                        </div>
                      </div>
                    </div>

                    {/* Room number plaque */}
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-24 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg shadow-xl border-2 border-yellow-700 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl font-black text-amber-950">404</div>
                        <div className="text-xs text-amber-900 font-semibold mt-1">ROOM</div>
                      </div>
                    </div>

                    {/* Door handle */}
                    <div className="absolute top-1/2 right-8 -translate-y-1/2">
                      <div className="w-4 h-12 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full shadow-lg" />
                      <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full shadow-xl" />
                    </div>

                    {/* Peephole */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-gray-800 to-black rounded-full shadow-inner">
                      <div className="absolute inset-1 bg-gradient-to-br from-blue-900 to-black rounded-full opacity-70" />
                    </div>

                    {/* Do Not Disturb Sign */}
                    <div className="absolute -right-2 top-24 transform rotate-12">
                      <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl border-2 border-red-700">
                        <div className="text-center">
                          <div className="font-black text-lg">DO NOT</div>
                          <div className="font-black text-lg -mt-1">DISTURB</div>
                          <div className="text-xs mt-1 opacity-90">Page Not Available</div>
                        </div>
                      </div>
                    </div>

                    {/* Wood grain texture overlay */}
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay rounded-lg">
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Door frame shadow */}
                  <div className="absolute inset-0 -z-10 blur-2xl opacity-50 bg-amber-900" />
                </div>

                {/* Interactive button */}
                <button
                  onClick={() => setDoorOpen(!doorOpen)}
                  className="mt-6 w-full px-6 py-3 bg-amber-100 border-2 border-amber-300 text-amber-900 rounded-lg font-semibold hover:bg-amber-200 transition-colors"
                >
                  {doorOpen ? 'Close Door' : 'Try Opening Door'}
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-8 text-center lg:text-left">
              {/* Hotel header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <h3 className="text-lg font-semibold text-amber-800">Maxy Grand Hotel</h3>
              </div>

              {/* Main message */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight">
                  Maxy 404
                  <br />
                  <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    Not Available
                  </span>
                </h1>
                
                <p className="text-xl text-gray-700 max-w-lg">
                  We apologize, but this page doesn't exist in our dashboard. Perhaps you have the wrong room number?
                </p>
              </div>

              {/* Hotel info card */}
              {/* <div className="p-6 bg-white border-2 border-amber-200 rounded-2xl shadow-lg space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Bell className="w-6 h-6 text-amber-700" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-gray-900 mb-1">Front Desk Message</h4>
                    <p className="text-sm text-gray-600">
                      "Dear valued guest, the page you're looking for doesn't exist in our system. 
                      Please check your booking confirmation or return to our main lobby."
                    </p>
                  </div>
                </div> */}

                {/* Reception info */}
                {/* <div className="grid grid-cols-2 gap-4 pt-4 border-t border-amber-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>24/7 Support</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>Concierge Available</span>
                  </div>
                </div>
              </div> */}

              {/* Error details */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-red-800">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-semibold">Access Denied:</span>
                  <code className="font-mono text-xs bg-red-100 px-2 py-1 rounded">
                    {location.pathname}
                  </code>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold text-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/50 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Home className="w-5 h-5" />
                    Return to dashboard
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>

                <button
                  onClick={() => navigate(-1)}
                  className="px-8 py-4 bg-white border-2 border-amber-300 text-amber-800 rounded-xl font-bold text-lg transition-all duration-300 hover:bg-amber-50 hover:border-amber-400 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Go Back
                </button>
              </div>

              {/* Hotel amenities showcase */}
              {/* <div className="pt-6">
                <p className="text-sm text-gray-500 mb-3">Explore Our Services:</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Rooms', path: '/rooms' },
                    { label: 'Bookings', path: '/bookings' },
                    { label: 'Services', path: '/services' },
                  ].map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="px-4 py-3 bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 text-amber-900 rounded-lg text-sm font-semibold hover:from-amber-200 hover:to-orange-200 transition-all hover:scale-105"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Footer decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
    </div>
  );
};

export default NotFoundHotelDoor;