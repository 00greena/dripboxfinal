import React, { useEffect, useRef, useState } from "react";
import { loadStripe } from '@stripe/stripe-js';

// —— Utility functions removed for production build —— //

// —— Background: Starry sky with neon supernovas (static) —— //
// Starfield component removed for production build

// —— Simple hover-tilt + glass card —— //
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--rx", String(py * -4));
      el.style.setProperty("--ry", String(px * 6));
    };
    const onLeave = () => {
      el.style.setProperty("--rx", "0");
      el.style.setProperty("--ry", "0");
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);
  return (
    <div
      ref={ref}
      style={{ transform: "perspective(1000px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))" }}
      className={
        "relative rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-lg transition-all duration-300 hover:shadow-xl " +
        className
      }
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// —— Types —— //
interface Texture {
  id: string;
  name: string;
  priceDelta?: number;
  // image URL for preview; fallbackColor if missing
  image?: string;
  fallbackColor?: string;
}

const TEXTURES: Texture[] = [
  { id: "plain", name: "Plain (Upload Art)", fallbackColor: "#f3f4f6" },
  { id: "cosmic-nova", name: "Cosmic Nova", image: "/photos/lid1.png" },
  { id: "volcano-lava", name: "Volcano Lava", image: "/photos/lid2.png" },
  { id: "ice-crystal", name: "Ice Crystal", image: "/photos/lid3.png" },
  { id: "neon-lattice", name: "Neon Lattice", image: "/photos/lid4.png" },
  { id: "camo-volt", name: "Camo Volt", image: "/photos/lid5.png" },
  { id: "dragon-fire", name: "Dragon Fire Scales", image: "/photos/lid6.png" },
  { id: "sea-dragon", name: "Sea Dragon Scales", image: "/photos/lid7.png" },
  { id: "caramel-croc", name: "Caramel Croc", image: "/photos/lid8.png" },
  { id: "green-viper", name: "Green Viper", image: "/photos/lid9.png" },
  { id: "carbon", name: "Carbon Weave", image: "/photos/lid10.png" },
];

// Public product photos shown in the gallery
const PRODUCT_PHOTOS: { src: string; alt: string }[] = [
  { src: "/photos/lid1.png", alt: "Cosmic Nova lid with colorful pattern" },
  { src: "/photos/lid2.png", alt: "Volcanic lava lid design" },
  { src: "/photos/lid3.png", alt: "Ice crystal lid pattern" },
  { src: "/photos/lid4.png", alt: "Neon green lattice lid" },
  { src: "/photos/lid5.png", alt: "Camo Volt texture design" },
  { src: "/photos/lid6.png", alt: "Dragon Fire Scales texture" },
  { src: "/photos/lid7.png", alt: "Sea Dragon Scales pattern" },
  { src: "/photos/lid8.png", alt: "Caramel Croc texture" },
  { src: "/photos/lid9.png", alt: "Green Viper pattern" },
  { src: "/photos/lid10.png", alt: "Carbon weave texture" },
  { src: "/photos/lid11.png", alt: "Special edition pattern" },
  { src: "/photos/monogram.png", alt: "Monogrammed Storage Cases with Icon Patterns" }
];

const BASE_PRICE = 29.99; // GBP, adjust as needed

// —— Lid Editor (canvas) —— //
function LidEditor({
  chosenTexture,
  onSnapshot,
  artImage,
  setArtImage,
}: {
  chosenTexture: Texture;
  onSnapshot: (dataUrl: string) => void;
  artImage: HTMLImageElement | null;
  setArtImage: (img: HTMLImageElement | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState(1.5);
  const [rotation, setRotation] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragRef = useRef({ x: 0, y: 0 });
  const textureImgRef = useRef<HTMLImageElement | null>(null);
  const previewImgRef = useRef<HTMLImageElement | null>(null);

  // Load texture image if provided
  useEffect(() => {
    if (!chosenTexture.image) {
      textureImgRef.current = null;
      redraw();
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      textureImgRef.current = img;
      redraw();
    };
    img.src = chosenTexture.image;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenTexture.id]);

  // Load preview template image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      previewImgRef.current = img;
      redraw();
    };
    img.onerror = () => {
      console.warn('Could not load preview template image');
    };
    img.src = '/preview.png';
  }, []);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setArtImage(img);
      URL.revokeObjectURL(url);
      redraw();
    };
    img.src = url;
  };


  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPos({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const onPointerUp = () => setIsDragging(false);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const W = 640; // editor logical size (square)
    const H = 640;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // board background - use preview template if available
    ctx.clearRect(0, 0, W, H);
    if (previewImgRef.current) {
      // Draw the preview template image as background
      const img = previewImgRef.current;
      const scale = Math.max(W / img.width, H / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      const sx = (W - sw) / 2;
      const sy = (H - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh);
    } else {
      ctx.fillStyle = "#0b0f1a";
      ctx.fillRect(0, 0, W, H);
    }

    // Lid rounded rect
    const inset = 28;
    const r = 34;
    const x = inset, y = inset, w = W - inset * 2, h = H - inset * 2;

    ctx.save();
    // clip rounded rect
    const rr = new Path2D();
    rr.moveTo(x + r, y);
    rr.arcTo(x + w, y, x + w, y + h, r);
    rr.arcTo(x + w, y + h, x, y + h, r);
    rr.arcTo(x, y + h, x, y, r);
    rr.arcTo(x, y, x + w, y, r);
    rr.closePath();
    ctx.clip(rr);

    // texture fill
    if (textureImgRef.current) {
      const img = textureImgRef.current;
      // cover the area
      const scaleTexture = Math.max(w / img.width, h / img.height);
      const tw = img.width * scaleTexture;
      const th = img.height * scaleTexture;
      const tx = x + (w - tw) / 2;
      const ty = y + (h - th) / 2;
      ctx.drawImage(img, tx, ty, tw, th);
    } else {
      ctx.fillStyle = chosenTexture.fallbackColor || "#eceff1";
      ctx.fillRect(x, y, w, h);
    }

    // subtle gloss
    const gloss = ctx.createLinearGradient(0, y, 0, y + h);
    gloss.addColorStop(0, "rgba(255,255,255,0.25)");
    gloss.addColorStop(0.08, "rgba(255,255,255,0.06)");
    gloss.addColorStop(0.4, "rgba(255,255,255,0.0)");
    ctx.fillStyle = gloss;
    ctx.fillRect(x, y, w, h);

    // artwork overlay
    if (artImage) {
      ctx.save();
      ctx.translate(x + w / 2 + pos.x, y + h / 2 + pos.y);
      ctx.rotate((rotation * Math.PI) / 180);
      const scaleArt = scale * Math.min(w / artImage.width, h / artImage.height);
      const aw = artImage.width * scaleArt;
      const ah = artImage.height * scaleArt;
      ctx.drawImage(artImage, -aw / 2, -ah / 2, aw, ah);
      ctx.restore();
    }

    // safe area + bleed guides
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.strokeRect(x + 16, y + 16, w - 32, h - 32);
  };

  // redraw when controls change
  useEffect(() => { 
    redraw(); 
  }, [artImage, pos.x, pos.y, scale, rotation, chosenTexture.id]);

  // Drag and drop handlers for file uploads
  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Handle file drops
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFile(imageFile);
    }
  };

  // Export snapshot for cart thumbnails / print
  const handleSnapshot = () => {
    const dataUrl = canvasRef.current?.toDataURL("image/png", 1.0) || "";
    onSnapshot(dataUrl);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      <div>
        <GlassCard className="p-3">
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mx-auto h-[640px] w-[640px] max-w-full touch-pan-y cursor-grab rounded-3xl transition-all duration-200 ${
              isDragOver ? 'ring-4 ring-blue-500 ring-opacity-50 scale-105 shadow-2xl' : ''
            }`}
          />
        </GlassCard>
        <div className="mt-3 text-center text-xs text-gray-600">
          Drag to reposition artwork · Use sliders to scale & rotate
          <br />
          <span className="text-blue-600">💡 Drag image files directly onto the preview</span>
        </div>
      </div>

      <div className="grid content-start gap-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Artwork</div>
              <div className="text-xs text-gray-600">Upload your own image or generate one with AI</div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center overflow-hidden rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-800">
              <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }} />
              Upload File
            </label>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="col-span-3">
              <label className="mb-1 block text-xs text-gray-700">Scale</label>
              <input type="range" min={0.2} max={3} step={0.01} value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div className="col-span-3">
              <label className="mb-1 block text-xs text-gray-700">Rotation</label>
              <input type="range" min={-180} max={180} step={1} value={rotation} onChange={(e) => setRotation(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div className="col-span-3 flex items-center gap-2">
              <button className="rounded-xl bg-gray-200 px-3 py-2 text-sm text-gray-900 hover:bg-gray-300" onClick={() => { setScale(1); setRotation(0); setPos({ x: 0, y: 0 }); }}>Reset</button>
              <button className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800" onClick={handleSnapshot}>Save Preview</button>
            </div>
          </div>
        </GlassCard>


        <GlassCard>
          <div className="text-sm font-medium text-gray-900">Texture</div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TEXTURES.map((t) => (
              <label key={t.id} className="group relative block cursor-pointer overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-2 hover:border-gray-400">
                <input type="radio" name="texture" className="peer sr-only" defaultChecked={t.id === "plain"} onChange={() => {
                  // @ts-ignore attach id for parent state via custom event
                  const ev = new CustomEvent("texture:change", { detail: t });
                  window.dispatchEvent(ev);
                }} />
                <div className="relative h-28 w-full rounded-lg bg-gray-100">
                  {t.image ? (
                    <img src={t.image} alt={t.name} className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <div className="h-full w-full rounded-lg" style={{ background: `linear-gradient(135deg, ${t.fallbackColor} 0%, #e5e7eb 100%)` }} />
                  )}
                  <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-inset ring-transparent peer-checked:ring-blue-500" />
                </div>
                <div className="mt-2 text-xs text-gray-700">{t.name}</div>
              </label>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// —— Lightbox for product photos —— //
function Lightbox({ photos, index, onClose }: { photos: { src: string; alt: string }[]; index: number; onClose: () => void }) {
  if (index < 0) return null;
  const photo = photos[index];
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm">
      <button aria-label="Close" onClick={onClose} className="absolute right-6 top-6 rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/20">Close</button>
      <div className="flex h-full items-center justify-center p-6">
        <img src={photo.src} alt={photo.alt} className="max-h-full max-w-full rounded-2xl shadow-2xl" />
      </div>
    </div>
  );
}


// —— Hero Carousel Component —— //
function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselImages = [
    "/photos/lid1.png",
    "/photos/lid2.png", 
    "/photos/lid3.png",
    "/photos/lid4.png",
    "/photos/lid5.png",
    "/photos/lid6.png",
    "/photos/lid7.png",
    "/photos/lid8.png",
    "/photos/lid9.png",
    "/photos/lid10.png",
    "/photos/lid11.png",
    "/photos/monogram.png"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden">
      {/* Current Image */}
      <img 
        src={carouselImages[currentIndex]} 
        alt={`STASHBOX lid design ${currentIndex + 1}`} 
        className="h-full w-full object-cover transition-opacity duration-500"
      />
      
      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {carouselImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-white w-6' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => setCurrentIndex((prevIndex) => (prevIndex - 1 + carouselImages.length) % carouselImages.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
        aria-label="Previous image"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselImages.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
        aria-label="Next image"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// —— Cart + Checkout (front-end only) —— //
interface CartItem { id: string; name: string; price: number; qty: number; preview?: string; textureId: string; }

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch { return initial; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue] as const;
}

function Cart({ open, onClose, items, setItems }: { open: boolean; onClose: () => void; items: CartItem[]; setItems: (items: CartItem[]) => void; }) {
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  const [stage, setStage] = useState<"cart" | "checkout" | "success">("cart");
  const [isProcessing, setIsProcessing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", address: "" });

  useEffect(() => { if (open) setStage("cart"); }, [open]);

  const handleStripeCheckout = async () => {
    if (!form.name || !form.email || !form.address) {
      alert('Please fill in all fields');
      return;
    }

    setIsProcessing(true);

    try {
      // Get Stripe publishable key
      const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      console.log('Environment check:', {
        hasKey: !!stripePublishableKey,
        allEnvVars: import.meta.env
      });
      
      if (!stripePublishableKey) {
        throw new Error('Stripe publishable key not found. Please check environment variables.');
      }

      // Initialize Stripe
      const stripe = await loadStripe(stripePublishableKey);
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      // Create checkout session - remove preview images to reduce payload size
      const itemsForCheckout = items.map(item => ({
        ...item,
        preview: undefined // Remove large image data from request
      }));

      console.log('Sending checkout request...', { itemsForCheckout, customerInfo: form });

      const response = await fetch('/api/checkout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: itemsForCheckout,
          customerInfo: form,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();

      // Check if we got a URL (recommended) or sessionId (legacy)
      if (data.url) {
        // Direct redirect to Stripe Checkout URL (recommended)
        window.location.href = data.url;
      } else if (data.sessionId) {
        // Legacy method using Stripe.js redirectToCheckout
        const result = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
        if (result.error) {
          throw new Error(result.error.message);
        }
      } else {
        throw new Error('Invalid response from checkout session');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full max-w-md transform transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex h-full flex-col gap-4 bg-white p-6 text-gray-900 shadow-2xl border-l border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{stage === "cart" ? "Your Cart" : stage === "checkout" ? "Checkout" : "Order Complete"}</h2>
            <button onClick={onClose} className="rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200">Close</button>
          </div>

          {stage === "cart" && (
            <>
              <div className="flex-1 space-y-3 overflow-auto">
                {items.length === 0 && <div className="text-gray-500">Your cart is empty.</div>}
                {items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 bg-gray-50">
                    <img src={it.preview || "/placeholder.png"} alt="preview" className="h-16 w-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">STASHBOX — {it.name}</div>
                      <div className="text-xs text-gray-600">Texture: {it.textureId}</div>
                      <div className="mt-1 text-sm font-semibold text-gray-900">£{it.price.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="rounded-full bg-gray-200 px-2 py-1 text-gray-900 hover:bg-gray-300" onClick={() => setItems(items.map((x, idx) => idx === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}>−</button>
                      <div className="w-6 text-center text-sm font-medium">{it.qty}</div>
                      <button className="rounded-full bg-gray-200 px-2 py-1 text-gray-900 hover:bg-gray-300" onClick={() => setItems(items.map((x, idx) => idx === i ? { ...x, qty: x.qty + 1 } : x))}>+</button>
                      <button className="ml-2 rounded-xl bg-red-100 px-3 py-1 text-xs text-red-700 hover:bg-red-200" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">Subtotal</div>
                  <div className="font-semibold text-gray-900">£{total.toFixed(2)}</div>
                </div>
                <button disabled={!items.length} onClick={() => setStage("checkout")} className="mt-3 w-full rounded-2xl bg-gray-900 text-white px-5 py-3 font-semibold hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">Checkout</button>
                <div className="mt-2 text-center text-xs text-gray-500">Secure payment with Stripe</div>
              </div>
            </>
          )}

          {stage === "checkout" && (
            <>
              <div className="flex-1 space-y-3 overflow-auto">
                <input className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none placeholder:text-gray-400 focus:border-blue-500" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input type="email" className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none placeholder:text-gray-400 focus:border-blue-500" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <textarea className="h-32 w-full rounded-xl border border-gray-200 bg-white p-3 outline-none placeholder:text-gray-400 focus:border-blue-500" placeholder="Shipping address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
                  <div className="mb-2 font-medium text-gray-900">Order Summary</div>
                  {items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-gray-700">
                      <span>{it.name} × {it.qty}</span>
                      <span>£{(it.price * it.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="mt-2 border-t border-gray-200 pt-2 font-semibold text-gray-900">Total £{total.toFixed(2)}</div>
                </div>
              </div>
              <div>
                <button 
                  onClick={handleStripeCheckout}
                  disabled={isProcessing || !form.name || !form.email || !form.address}
                  className="w-full rounded-2xl bg-white px-5 py-3 font-semibold text-black hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Pay £${total.toFixed(2)} with Stripe`
                  )}
                </button>
                <button onClick={() => setStage("cart")} className="mt-2 w-full rounded-2xl bg-gray-100 px-5 py-3 font-semibold text-gray-900 hover:bg-gray-200">Back</button>
                <div className="mt-2 text-center text-xs text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Secure payment powered by Stripe
                  </div>
                </div>
              </div>
            </>
          )}

          {stage === "success" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="text-3xl font-semibold">Thank you! 🎉</div>
              <div className="max-w-sm text-white/70">Your order has been placed. A confirmation email will be sent shortly.</div>
              <button onClick={() => { setItems([]); onClose(); }} className="rounded-2xl bg-white px-5 py-3 font-semibold text-black">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// —— Main App —— //
// Simple success page component
function SuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = urlParams.get('session_id');
    setSessionId(sessionIdFromUrl);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your order. Your custom STASHBOX lid is being prepared for production.
        </p>
        
        {sessionId && (
          <p className="text-xs text-gray-500 mb-6">
            Order ID: {sessionId}
          </p>
        )}
        
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You'll receive an order confirmation email shortly</li>
              <li>• We'll start 3D printing your custom lid</li>
              <li>• Your order will ship within 3-5 business days</li>
              <li>• Tracking information will be provided</li>
            </ul>
          </div>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-900 text-white rounded-xl px-6 py-3 font-semibold hover:bg-gray-800"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [texture, setTexture] = useState<Texture>(TEXTURES[0]);
  const [artImg, setArtImage] = useState<HTMLImageElement | null>(null);
  const [snapshot, setSnapshot] = useState<string>("");
  const [cartOpen, setCartOpen] = useState(false);
  const [items, setItems] = useLocalStorage<CartItem[]>("dripbox.cart", []);
  const [lightboxIdx, setLightboxIdx] = useState(-1);

  useEffect(() => {
    const handler = (e: any) => setTexture(e.detail as Texture);
    window.addEventListener("texture:change", handler as any);
    return () => window.removeEventListener("texture:change", handler as any);
  }, []);

  const addToCart = () => {
    const it: CartItem = { id: crypto.randomUUID(), name: "Custom Box Lid", price: BASE_PRICE + (texture.priceDelta || 0), qty: 1, preview: snapshot, textureId: texture.name };
    setItems([...items, it]);
    setCartOpen(true);
  };

  // Simple routing based on URL path
  const currentPath = window.location.pathname;
  if (currentPath === '/success') {
    return <SuccessPage />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Logo removed - now displayed above hero text */}
          </div>
          <nav className="hidden gap-6 text-sm md:flex">
            <a className="text-gray-600 hover:text-gray-900" href="#design">Design</a>
            <a className="text-gray-600 hover:text-gray-900" href="#faq">FAQ</a>
            <a className="text-gray-600 hover:text-gray-900" href="#contact">Contact</a>
          </nav>
          <button onClick={() => setCartOpen(true)} className="rounded-full bg-gray-900 text-white px-3 py-2 text-sm hover:bg-gray-800">Cart ({items.length})</button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-14 md:pb-20 md:pt-24">
        {/* Large Logo */}
        <div className="text-left mb-12">
          <img 
            src="/logo2.png" 
            alt="STASHBOX" 
            className="h-48 w-auto md:h-60 lg:h-72"
          />
        </div>
        
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              One Product. Infinite Lids.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg text-gray-600">
              Design a 3D‑printed box lid that's uniquely yours. Choose a premium texture or upload your own artwork, then drag, scale, and rotate to perfection.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#design" className="rounded-2xl bg-gray-900 text-white px-6 py-3 font-semibold shadow-xl hover:bg-gray-800">Start Designing</a>
              <a href="#faq" className="rounded-2xl bg-gray-100 px-6 py-3 font-semibold text-gray-900 hover:bg-gray-200">Learn more</a>
            </div>
          </div>

          <HeroCarousel />
        </div>
      </section>

      {/* Designer */}
      <section id="design" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Design Your Lid</h2>
            <p className="text-gray-600">Base price £{BASE_PRICE.toFixed(2)} · Ships in 3–5 days</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Texture: <span className="font-medium text-gray-900">{texture.name}</span></div>
            <div className="text-sm text-gray-600">Price: <span className="font-medium text-gray-900">£{(BASE_PRICE + (texture.priceDelta || 0)).toFixed(2)}</span></div>
          </div>
        </div>

        <LidEditor chosenTexture={texture} artImage={artImg} setArtImage={setArtImage} onSnapshot={(url) => setSnapshot(url)} />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button onClick={addToCart} className="rounded-2xl bg-gray-900 text-white px-6 py-3 font-semibold shadow-xl hover:bg-gray-800 disabled:opacity-50" disabled={!snapshot}>Add to Cart</button>
          <div className="text-sm text-gray-600">Tip: Click "Save Preview" in the editor to generate a cart thumbnail.</div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <GlassCard>
            <div className="text-lg font-semibold text-gray-900">Premium Textures</div>
            <p className="mt-2 text-sm text-gray-600">From carbon weave to dragon scales, each texture renders with depth and gloss for a realistic preview.</p>
          </GlassCard>
          <GlassCard>
            <div className="text-lg font-semibold text-gray-900">High‑Res Printing</div>
            <p className="mt-2 text-sm text-gray-600">We generate a print‑ready file (up to 8K) so your design stays razor‑sharp on the 200×190 mm lid area.</p>
          </GlassCard>
          <GlassCard>
            <div className="text-lg font-semibold text-gray-900">Fast Fulfilment</div>
            <p className="mt-2 text-sm text-gray-600">Most orders ship within 3–5 business days. Local pickup available.</p>
          </GlassCard>
        </div>
      </section>

      {/* Product Photos */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <h3 className="mb-6 text-2xl font-semibold text-gray-900">Product Photos</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_PHOTOS.map((p, i) => (
            <GlassCard key={i} className="overflow-hidden p-0">
              <button onClick={() => setLightboxIdx(i)} className="group block">
                <img src={p.src} alt={p.alt} className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              </button>
              <div className="p-3 text-sm text-gray-600">{p.alt}</div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-5xl px-6 pb-24">
        <h3 className="mb-6 text-2xl font-semibold text-gray-900">FAQ</h3>
        <div className="space-y-4">
          <GlassCard>
            <div className="text-sm font-medium text-gray-900">What image size works best?</div>
            <p className="mt-2 text-sm text-gray-600">Square images ≥ 2048×2048 px are recommended. Larger files (up to ~8K) look even better.</p>
          </GlassCard>
          <GlassCard>
            <div className="text-sm font-medium text-gray-900">Can I use transparent PNGs?</div>
            <p className="mt-2 text-sm text-gray-600">Yes. Transparency is preserved so your chosen texture can show through.</p>
          </GlassCard>
          <GlassCard>
            <div className="text-sm font-medium text-gray-900">How do I pay?</div>
            <p className="mt-2 text-sm text-gray-600">This demo uses a mock checkout. When you deploy, connect Stripe Checkout in <code className="rounded bg-gray-200 px-1">/api/checkout</code> and the cart will redirect there.</p>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-gray-200 py-12 text-center text-sm text-gray-600">
        <div className="mx-auto max-w-7xl px-6">
          © {new Date().getFullYear()} STASHBOX · Premium Storage Solutions · Contact: hello@stashbox.com
        </div>
      </footer>

      <Cart open={cartOpen} onClose={() => setCartOpen(false)} items={items} setItems={setItems} />
      <Lightbox photos={PRODUCT_PHOTOS} index={lightboxIdx} onClose={() => setLightboxIdx(-1)} />
    </div>
  );
}