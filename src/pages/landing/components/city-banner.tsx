export const CityBanner = () => (
  <div className="relative h-56 overflow-hidden lg:h-72">
    <img
      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80"
      alt="Modern financial district"
      className="h-full w-full object-cover"
      loading="lazy"
    />
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center"
      style={{
        background:
          "linear-gradient(135deg, rgba(204,0,0,0.88) 0%, rgba(92,0,0,0.82) 100%)",
      }}
    >
      <p className="max-w-2xl text-xl font-bold leading-snug text-white lg:text-2xl">
        Institutional-grade investment intelligence for Africa's most ambitious
        conglomerate.
      </p>
      <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
        Heirs Holdings Group · Lagos, Nigeria
      </p>
    </div>
  </div>
);
