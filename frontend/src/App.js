import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

// Import Shadcn UI components
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { toast } from "sonner";

// Icons
import { Sparkles, Zap, Shield, Globe, Edit, Plus, Trash2, Upload, LogOut, Eye, Rocket, Brain, Atom, Mail, Facebook, Instagram, Youtube, Linkedin } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Enhanced StarField Component with dense star field
const StarField = () => {
  useEffect(() => {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const stars = [];
    const numStars = 800; // Dense star field
    
    // Create stars with different sizes and speeds
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 0.5,
        speed: Math.random() * 0.8 + 0.1,
        opacity: Math.random() * 0.9 + 0.1,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.01
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => {
        // Move star vertically
        star.y += star.speed;
        if (star.y > canvas.height + 10) {
          star.y = -10;
          star.x = Math.random() * canvas.width;
        }
        
        // Update twinkle
        star.twinkle += star.twinkleSpeed;
        const twinkleOpacity = star.opacity * (0.3 + 0.7 * (Math.sin(star.twinkle) + 1) / 2);
        
        // Draw star with enhanced glow
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = star.size * 2;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add purple glow for some stars
        if (star.size > 2) {
          ctx.fillStyle = `rgba(139, 92, 246, ${twinkleOpacity * 0.3})`;
          ctx.shadowColor = '#8B5CF6';
          ctx.shadowBlur = star.size * 4;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.shadowBlur = 0;
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return <canvas id="starfield" className="fixed inset-0 -z-10" />;
};

// Molecular Background Component
const MolecularBackground = () => {
  useEffect(() => {
    const canvas = document.getElementById('molecular-bg');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const molecules = [];
    const numMolecules = 50;
    
    // Create molecular points
    for (let i = 0; i < numMolecules; i++) {
      molecules.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw molecules
      molecules.forEach(molecule => {
        molecule.x += molecule.vx;
        molecule.y += molecule.vy;
        
        // Wrap around edges
        if (molecule.x < 0) molecule.x = canvas.width;
        if (molecule.x > canvas.width) molecule.x = 0;
        if (molecule.y < 0) molecule.y = canvas.height;
        if (molecule.y > canvas.height) molecule.y = 0;
        
        // Draw molecule
        ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
        ctx.beginPath();
        ctx.arc(molecule.x, molecule.y, molecule.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw connections between nearby molecules
      for (let i = 0; i < molecules.length; i++) {
        for (let j = i + 1; j < molecules.length; j++) {
          const dx = molecules[i].x - molecules[j].x;
          const dy = molecules[i].y - molecules[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            const opacity = (150 - distance) / 150 * 0.2;
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(molecules[i].x, molecules[i].y);
            ctx.lineTo(molecules[j].x, molecules[j].y);
            ctx.stroke();
          }
        }
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return <canvas id="molecular-bg" className="fixed inset-0 -z-20" />;
};

// Auth Context
const AuthContext = React.createContext();
const useAuth = () => React.useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('vornexz_token'));
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (token) {
      // Verify token
      axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        setIsAuthenticated(true);
      }).catch(() => {
        localStorage.removeItem('vornexz_token');
        setToken(null);
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token]);
  
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token } = response.data;
      localStorage.setItem('vornexz_token', access_token);
      setToken(access_token);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      toast.error("Credenciais inválidas");
      return false;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('vornexz_token');
    setToken(null);
    setIsAuthenticated(false);
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Public Home Component
const Home = () => {
  const [companies, setCompanies] = useState([]);
  const [content, setContent] = useState({});
  const [config, setConfig] = useState({});
  
  useEffect(() => {
    fetchPublicData();
  }, []);
  
  const fetchPublicData = async () => {
    try {
      const [companiesRes, contentRes, configRes] = await Promise.all([
        axios.get(`${API}/companies`),
        axios.get(`${API}/content`),
        axios.get(`${API}/config`)
      ]);
      
      setCompanies(companiesRes.data);
      
      // Convert content array to object
      const contentObj = {};
      contentRes.data.forEach(item => {
        contentObj[item.section] = item;
      });
      setContent(contentObj);
      setConfig(configRes.data);
    } catch (error) {
      console.error("Error fetching public data:", error);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <StarField />
      <MolecularBackground />
      
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-purple-400/30">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {config.logo_url && (
              <img 
                src={`${BACKEND_URL}${config.logo_url}`} 
                alt="VornexZ Logo" 
                className="h-10 w-auto"
              />
            )}
            <div className="text-2xl font-bold">
              <span className="cyberpunk-logo-text bg-gradient-to-r from-purple-300 via-purple-100 to-white bg-clip-text text-transparent">
                VornexZ
              </span>
            </div>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#home" className="nav-link">Início</a>
            <a href="#about" className="nav-link">Sobre</a>
            <a href="#companies" className="nav-link">Empresas</a>
            <a href="#contact" className="nav-link">Contato</a>
          </nav>
        </div>
      </header>
      
      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center relative pt-20">
        <div className="text-center z-10 max-w-4xl mx-auto px-6">
          <div className="space-logo mb-12">
            <h1 className="text-8xl md:text-9xl font-bold mb-6">
              <span className="main-logo-text">VornexZ</span>
            </h1>
            <div className="cosmic-subtitle">
              <Atom className="inline-block mr-3 h-8 w-8" />
              <span className="text-2xl">O FUTURO É AGORA</span>
              <Atom className="inline-block ml-3 h-8 w-8" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl mb-12 text-gray-200 leading-relaxed">
            {content.hero?.content || "A holding que transforma visões futuristas em realidade através de tecnologias revolucionárias"}
          </p>
          <Button 
            size="lg" 
            className="cosmic-button text-lg px-10 py-6"
            onClick={() => document.getElementById('companies').scrollIntoView({ behavior: 'smooth' })}
          >
            <Rocket className="mr-3 h-6 w-6" />
            Explorar o Futuro
            <Sparkles className="ml-3 h-6 w-6" />
          </Button>
        </div>
        
        {/* Floating cosmic elements (removed circles) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="cosmic-orb orb-1"></div>
          <div className="cosmic-orb orb-2"></div>
          <div className="cosmic-orb orb-3"></div>
        </div>
      </section>
      
      {/* About Section */}
      <section id="about" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-6xl font-bold mb-12 cosmic-heading">
              {content.about?.title || "Sobre a VornexZ"}
            </h2>
            <div className="space-card p-12">
              <div className="flex items-center justify-center mb-8">
                <Brain className="h-16 w-16 text-purple-400 mr-4" />
                <Atom className="h-20 w-20 text-white" />
                <Rocket className="h-16 w-16 text-purple-400 ml-4" />
              </div>
              <p className="text-xl text-gray-200 leading-relaxed">
                {content.about?.content || "A VornexZ representa o avanço definitivo na evolução empresarial do século XXI. Como holding visionária, consolidamos e desenvolvemos empresas que não apenas acompanham o futuro, mas o constroem ativamente."}
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Companies Section */}
      <section id="companies" className="py-24 relative">
        <div className="container mx-auto px-6">
          <h2 className="text-6xl font-bold text-center mb-20 cosmic-heading">Nossas Empresas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {companies.map((company, index) => (
              <div key={company.id} className="space-company-card" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="p-8">
                  <div className="text-center mb-6">
                    {company.logo_url ? (
                      <img 
                        src={`${BACKEND_URL}${company.logo_url}`} 
                        alt={company.name}
                        className="h-20 w-20 mx-auto mb-6 rounded-xl border-2 border-purple-400/50"
                      />
                    ) : (
                      <div className="h-20 w-20 mx-auto mb-6 rounded-xl border-2 border-purple-400/50 flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-purple-800/20">
                        <Atom className="h-10 w-10 text-purple-300" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-center cosmic-text">{company.name}</h3>
                  <p className="text-gray-300 text-center mb-6 leading-relaxed">{company.description}</p>
                  {company.category && (
                    <Badge className="space-badge mx-auto block w-fit mb-4">{company.category}</Badge>
                  )}
                  {company.website && (
                    <Button variant="outline" size="sm" className="w-full cosmic-outline-button" asChild>
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="mr-2 h-4 w-4" />
                        Explorar
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Differentials Section */}
      <section id="differentials" className="py-24 relative">
        <div className="container mx-auto px-6">
          <h2 className="text-6xl font-bold text-center mb-20 cosmic-heading">
            {content.differentials?.title || "Nossos Diferenciais"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              { icon: Atom, title: "Inovação Quântica", desc: "Tecnologias de vanguarda que transcendem limitações" },
              { icon: Shield, title: "Visão Futurista", desc: "Soluções pensadas para as próximas décadas" },  
              { icon: Brain, title: "Inteligência Avançada", desc: "IA e machine learning de última geração" },
              { icon: Rocket, title: "Expansão Cósmica", desc: "Alcance e impacto em escala universal" }
            ].map((item, index) => (
              <div key={index} className="space-differential-card" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="cosmic-icon-wrapper mb-6">
                  <item.icon className="h-12 w-12 cosmic-icon" />
                </div>
                <h3 className="text-xl font-bold mb-3 cosmic-text">{item.title}</h3>
                <p className="text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Contact Section */}
      <section id="contact" className="py-24 relative">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-6xl font-bold mb-12 cosmic-heading">Contato</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Conecte-se conosco e faça parte do futuro. Siga nossas redes sociais e acompanhe as inovações que estão transformando o mundo.
          </p>
          
          {/* Social Media Links */}
          <div className="flex justify-center space-x-6 mb-12">
            <a href="https://facebook.com/vornexz" target="_blank" rel="noopener noreferrer" className="social-button facebook">
              <Facebook className="h-6 w-6" />
              <span>Facebook</span>
            </a>
            <a href="https://instagram.com/vornexz" target="_blank" rel="noopener noreferrer" className="social-button instagram">
              <Instagram className="h-6 w-6" />
              <span>Instagram</span>
            </a>
            <a href="https://youtube.com/@vornexz" target="_blank" rel="noopener noreferrer" className="social-button youtube">
              <Youtube className="h-6 w-6" />
              <span>YouTube</span>
            </a>
            <a href="https://linkedin.com/company/vornexz" target="_blank" rel="noopener noreferrer" className="social-button linkedin">
              <Linkedin className="h-6 w-6" />
              <span>LinkedIn</span>
            </a>
            <a href="mailto:contato@vornexz.com" className="social-button email">
              <Mail className="h-6 w-6" />
              <span>Email</span>
            </a>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-16 border-t border-purple-400/30 bg-black/70 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <div className="text-3xl font-bold mb-6">
            <span className="cosmic-logo-footer">VornexZ</span>
          </div>
          <p className="text-gray-400 mb-8 text-lg">
            {content.footer?.content || "© 2025 VornexZ — Construindo o futuro, empresa por empresa."}
          </p>
          <div className="flex justify-center space-x-8 mb-6">
            <a href="#home" className="footer-link">Início</a>
            <a href="#about" className="footer-link">Sobre</a>
            <a href="#companies" className="footer-link">Empresas</a>
            <a href="#contact" className="footer-link">Contato</a>
            <a href="/admin" className="footer-link">Admin</a>
          </div>
          
          {/* Footer Social Icons */}
          <div className="flex justify-center space-x-4">
            <a href="https://facebook.com/vornexz" target="_blank" rel="noopener noreferrer" className="footer-social-icon">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="https://instagram.com/vornexz" target="_blank" rel="noopener noreferrer" className="footer-social-icon">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="https://youtube.com/@vornexz" target="_blank" rel="noopener noreferrer" className="footer-social-icon">
              <Youtube className="h-5 w-5" />
            </a>
            <a href="https://linkedin.com/company/vornexz" target="_blank" rel="noopener noreferrer" className="footer-social-icon">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="mailto:contato@vornexz.com" className="footer-social-icon">
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Admin Login Component
const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      toast.success("Login realizado com sucesso!");
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
      <StarField />
      <MolecularBackground />
      <Card className="w-full max-w-md space-admin-card">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl cosmic-text">Admin Portal</CardTitle>
          <CardDescription className="text-purple-300">Acessar painel de controle VornexZ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-purple-200">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="space-input"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-purple-200">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="space-input"
              />
            </div>
            <Button type="submit" className="w-full cosmic-button" disabled={loading}>
              {loading ? "Conectando..." : "Acessar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = () => {
  const { logout } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [content, setContent] = useState({});
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchAdminData();
  }, []);
  
  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('vornexz_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [companiesRes, contentRes, configRes] = await Promise.all([
        axios.get(`${API}/companies`, { headers }),
        axios.get(`${API}/content`, { headers }),
        axios.get(`${API}/config`, { headers })
      ]);
      
      setCompanies(companiesRes.data);
      
      const contentObj = {};
      contentRes.data.forEach(item => {
        contentObj[item.section] = item;
      });
      setContent(contentObj);
      setConfig(configRes.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    toast.success("Logout realizado com sucesso!");
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-2xl cosmic-text">Carregando sistema...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white relative">
      <StarField />
      <MolecularBackground />
      
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-md border-b border-purple-400/30 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold cosmic-text">VornexZ Control Center</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild className="cosmic-outline-button">
              <a href="/" target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Ver Site
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="cosmic-outline-button">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-6">
        <Tabs defaultValue="companies" className="space-y-6">
          <TabsList className="space-tabs">
            <TabsTrigger value="companies">Empresas</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="companies">
            <CompaniesManager companies={companies} onUpdate={fetchAdminData} />
          </TabsContent>
          
          <TabsContent value="content">
            <ContentManager content={content} onUpdate={fetchAdminData} />
          </TabsContent>
          
          <TabsContent value="config">
            <ConfigManager config={config} onUpdate={fetchAdminData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Companies Manager Component (same implementation as before, just with space styling)
const CompaniesManager = ({ companies, onUpdate }) => {
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: "", description: "", website: "", category: "", logo_url: ""
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('vornexz_token');
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      if (editingCompany) {
        await axios.put(`${API}/companies/${editingCompany.id}`, formData, { headers });
        toast.success("Empresa atualizada com sucesso!");
      } else {
        await axios.post(`${API}/companies`, formData, { headers });
        toast.success("Empresa criada com sucesso!");
      }
      
      setEditingCompany(null);
      setFormData({ name: "", description: "", website: "", category: "", logo_url: "" });
      onUpdate();
    } catch (error) {
      toast.error("Erro ao salvar empresa");
    }
  };
  
  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      description: company.description,
      website: company.website || "",
      category: company.category || "",
      logo_url: company.logo_url || ""
    });
  };
  
  const handleDelete = async (company) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) return;
    
    const token = localStorage.getItem('vornexz_token');
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      await axios.delete(`${API}/companies/${company.id}`, { headers });
      toast.success("Empresa excluída com sucesso!");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao excluir empresa");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold cosmic-text">Gerenciar Empresas</h2>
        <Button onClick={() => {
          setEditingCompany(null);
          setFormData({ name: "", description: "", website: "", category: "", logo_url: "" });
        }} className="cosmic-button">
          <Plus className="mr-2 h-4 w-4" />
          Nova Empresa
        </Button>
      </div>
      
      {/* Form */}
      <Card className="space-admin-card">
        <CardHeader>
          <CardTitle className="cosmic-text">{editingCompany ? "Editar Empresa" : "Nova Empresa"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-purple-200">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="space-input"
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-purple-200">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="space-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-purple-200">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
                className="space-input"
              />
            </div>
            <div>
              <Label htmlFor="website" className="text-purple-200">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                className="space-input"
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="cosmic-button">
                {editingCompany ? "Atualizar" : "Criar"}
              </Button>
              {editingCompany && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditingCompany(null);
                    setFormData({ name: "", description: "", website: "", category: "", logo_url: "" });
                  }}
                  className="cosmic-outline-button"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Companies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Card key={company.id} className="space-admin-card">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg cosmic-text">{company.name}</h3>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(company)} className="cosmic-outline-button">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(company)} className="cosmic-outline-button text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-2">{company.description}</p>
              {company.category && (
                <Badge className="space-badge mb-2">{company.category}</Badge>
              )}
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" 
                   className="text-purple-400 hover:text-purple-300 text-sm">
                  {company.website}
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Content Manager Component (same implementation as before)
const ContentManager = ({ content, onUpdate }) => {
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "" });
  
  const sections = [
    { key: "hero", name: "Seção Hero" },
    { key: "about", name: "Sobre" },
    { key: "differentials", name: "Diferenciais" },
    { key: "footer", name: "Rodapé" }
  ];
  
  const handleEdit = (sectionKey) => {
    const section = content[sectionKey];
    setEditingSection(sectionKey);
    setFormData({
      title: section?.title || "",
      content: section?.content || ""
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('vornexz_token');
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      await axios.put(`${API}/content/${editingSection}`, formData, { headers });
      toast.success("Conteúdo atualizado com sucesso!");
      setEditingSection(null);
      onUpdate();
    } catch (error) {
      toast.error("Erro ao atualizar conteúdo");
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold cosmic-text">Gerenciar Conteúdo</h2>
      
      {editingSection && (
        <Card className="space-admin-card">
          <CardHeader>
            <CardTitle className="cosmic-text">Editando: {sections.find(s => s.key === editingSection)?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-purple-200">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="space-input"
                />
              </div>
              <div>
                <Label htmlFor="content" className="text-purple-200">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  required
                  rows={4}
                  className="space-input"
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="cosmic-button">Salvar</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingSection(null)}
                  className="cosmic-outline-button"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Card key={section.key} className="space-admin-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="cosmic-text">{section.name}</CardTitle>
                <Button size="sm" onClick={() => handleEdit(section.key)} className="cosmic-outline-button">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {content[section.key] && (
                <div className="space-y-2">
                  {content[section.key].title && (
                    <p className="text-purple-200"><strong>Título:</strong> {content[section.key].title}</p>
                  )}
                  <p className="text-gray-300"><strong>Conteúdo:</strong> {content[section.key].content}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Config Manager Component  
const ConfigManager = ({ config, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const token = localStorage.getItem('vornexz_token');
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await axios.post(`${API}/upload/logo`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success("Logo atualizado com sucesso!");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao fazer upload do logo");
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold cosmic-text">Configurações do Sistema</h2>
      
      <Card className="space-admin-card">
        <CardHeader>
          <CardTitle className="cosmic-text">Logo VornexZ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.logo_url && (
            <div>
              <p className="mb-2 text-purple-200">Logo atual:</p>
              <img 
                src={`${BACKEND_URL}${config.logo_url}`} 
                alt="Logo atual" 
                className="h-20 w-auto border border-purple-400/30 rounded"
              />
            </div>
          )}
          <div>
            <Label htmlFor="logo" className="text-purple-200">Novo Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploading}
              className="space-input"
            />
            {uploading && <p className="text-sm text-purple-400">Fazendo upload...</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-2xl cosmic-text">Inicializando sistema...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/admin/login" />;
};

// Main App Component
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;