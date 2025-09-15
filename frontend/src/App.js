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
import { Sparkles, Zap, Shield, Globe, Edit, Plus, Trash2, Upload, LogOut, Eye } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// StarField Component for animated background
const StarField = () => {
  useEffect(() => {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const stars = [];
    const numStars = 200;
    
    // Create stars
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.8 + 0.2
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => {
        // Move star
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
        
        // Draw star
        ctx.fillStyle = `rgba(139, 92, 246, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle glow
        ctx.shadowColor = '#8B5CF6';
        ctx.shadowBlur = 10;
        ctx.fill();
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
      
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {config.logo_url && (
              <img 
                src={`${BACKEND_URL}${config.logo_url}`} 
                alt="VornexZ Logo" 
                className="h-10 w-auto"
              />
            )}
            <div className="text-2xl font-bold">
              <span className="text-white cyberpunk-text">VornexZ</span>
              <span className="text-teal-400 cyberpunk-text">Pay</span>
            </div>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#home" className="hover:text-purple-400 transition-colors">Início</a>
            <a href="#about" className="hover:text-purple-400 transition-colors">Sobre</a>
            <a href="#companies" className="hover:text-purple-400 transition-colors">Empresas</a>
            <a href="#contact" className="hover:text-purple-400 transition-colors">Contato</a>
          </nav>
        </div>
      </header>
      
      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center relative pt-20">
        <div className="text-center z-10">
          <div className="cyberpunk-logo mb-8">
            <h1 className="text-8xl md:text-9xl font-bold mb-4">
              <span className="text-white glow-text">VornexZ</span>
              <span className="text-teal-400 glow-text-teal">Pay</span>
            </h1>
          </div>
          <p className="text-2xl md:text-3xl mb-8 text-gray-300">
            {content.hero?.content || "O Futuro dos Pagamentos Começa Aqui"}
          </p>
          <Button 
            size="lg" 
            className="cyberpunk-button text-lg px-8 py-4"
            onClick={() => document.getElementById('companies').scrollIntoView({ behavior: 'smooth' })}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Explorar Nossas Empresas
          </Button>
        </div>
        
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
      </section>
      
      {/* About Section */}
      <section id="about" className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-8 cyberpunk-text">
              {content.about?.title || "Sobre a VornexZ"}
            </h2>
            <div className="cyber-card p-8">
              <p className="text-xl text-gray-300 leading-relaxed">
                {content.about?.content || "A VornexZ é uma holding criada para acumular empresas inovadoras em diferentes áreas, todas unidas por uma visão futurista e disruptiva."}
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Companies Section */}
      <section id="companies" className="py-20 relative">
        <div className="container mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-16 cyberpunk-text">Nossas Empresas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companies.map((company, index) => (
              <div key={company.id} className="holographic-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="p-6">
                  {company.logo_url && (
                    <img 
                      src={`${BACKEND_URL}${company.logo_url}`} 
                      alt={company.name}
                      className="h-16 w-16 mx-auto mb-4 rounded-lg"
                    />
                  )}
                  <h3 className="text-2xl font-bold mb-3 text-center cyberpunk-text">{company.name}</h3>
                  <p className="text-gray-300 text-center mb-4">{company.description}</p>
                  {company.category && (
                    <Badge className="mx-auto block w-fit cyber-badge">{company.category}</Badge>
                  )}
                  {company.website && (
                    <Button variant="outline" size="sm" className="w-full mt-4 cyber-button" asChild>
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="mr-2 h-4 w-4" />
                        Visitar Site
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
      <section id="differentials" className="py-20 relative">
        <div className="container mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-16 cyberpunk-text">
            {content.differentials?.title || "Nossos Diferenciais"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Sparkles, title: "Inovação", desc: "Tecnologias de vanguarda" },
              { icon: Shield, title: "Acessibilidade", desc: "Soluções para todos" },  
              { icon: Zap, title: "Tecnologia", desc: "Ferramentas avançadas" },
              { icon: Globe, title: "Futuro Sustentável", desc: "Visão de longo prazo" }
            ].map((item, index) => (
              <div key={index} className="cyber-card text-center p-6" style={{ animationDelay: `${index * 0.1}s` }}>
                <item.icon className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                <h3 className="text-xl font-bold mb-2 cyberpunk-text">{item.title}</h3>
                <p className="text-gray-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-purple-500/20 bg-black/50">
        <div className="container mx-auto px-6 text-center">
          <div className="text-2xl font-bold mb-4">
            <span className="text-white cyberpunk-text">VornexZ</span>
            <span className="text-teal-400 cyberpunk-text">Pay</span>
          </div>
          <p className="text-gray-400 mb-6">
            {content.footer?.content || "© 2025 VornexZ — Construindo o futuro, empresa por empresa."}
          </p>
          <div className="flex justify-center space-x-6">
            <a href="#home" className="hover:text-purple-400 transition-colors">Início</a>
            <a href="#about" className="hover:text-purple-400 transition-colors">Sobre</a>
            <a href="#companies" className="hover:text-purple-400 transition-colors">Empresas</a>
            <a href="/admin" className="hover:text-purple-400 transition-colors">Admin</a>
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
      <Card className="w-full max-w-md cyber-card">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl cyberpunk-text">Admin Login</CardTitle>
          <CardDescription>Acesse o painel administrativo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="cyber-input"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="cyber-input"
              />
            </div>
            <Button type="submit" className="w-full cyberpunk-button" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
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
        <div className="text-2xl cyberpunk-text">Carregando...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white relative">
      <StarField />
      
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-md border-b border-purple-500/20 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold cyberpunk-text">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild className="cyber-button">
              <a href="/" target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Ver Site
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="cyber-button">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-6">
        <Tabs defaultValue="companies" className="space-y-6">
          <TabsList className="cyber-tabs">
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

// Companies Manager Component
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
        <h2 className="text-3xl font-bold cyberpunk-text">Gerenciar Empresas</h2>
        <Button onClick={() => {
          setEditingCompany(null);
          setFormData({ name: "", description: "", website: "", category: "", logo_url: "" });
        }} className="cyberpunk-button">
          <Plus className="mr-2 h-4 w-4" />
          Nova Empresa
        </Button>
      </div>
      
      {/* Form */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle>{editingCompany ? "Editar Empresa" : "Nova Empresa"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="cyber-input"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="cyber-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
                className="cyber-input"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                className="cyber-input"
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="cyberpunk-button">
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
                  className="cyber-button"
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
          <Card key={company.id} className="cyber-card">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg cyberpunk-text">{company.name}</h3>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(company)} className="cyber-button">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(company)} className="cyber-button text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-2">{company.description}</p>
              {company.category && (
                <Badge className="cyber-badge mb-2">{company.category}</Badge>
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

// Content Manager Component
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
      <h2 className="text-3xl font-bold cyberpunk-text">Gerenciar Conteúdo</h2>
      
      {editingSection && (
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle>Editando: {sections.find(s => s.key === editingSection)?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="cyber-input"
                />
              </div>
              <div>
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  required
                  rows={4}
                  className="cyber-input"
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="cyberpunk-button">Salvar</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingSection(null)}
                  className="cyber-button"
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
          <Card key={section.key} className="cyber-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{section.name}</CardTitle>
                <Button size="sm" onClick={() => handleEdit(section.key)} className="cyber-button">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {content[section.key] && (
                <div className="space-y-2">
                  {content[section.key].title && (
                    <p><strong>Título:</strong> {content[section.key].title}</p>
                  )}
                  <p><strong>Conteúdo:</strong> {content[section.key].content}</p>
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
      <h2 className="text-3xl font-bold cyberpunk-text">Configurações do Site</h2>
      
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle>Logo do Site</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.logo_url && (
            <div>
              <p className="mb-2">Logo atual:</p>
              <img 
                src={`${BACKEND_URL}${config.logo_url}`} 
                alt="Logo atual" 
                className="h-20 w-auto border border-purple-500/20 rounded"
              />
            </div>
          )}
          <div>
            <Label htmlFor="logo">Novo Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploading}
              className="cyber-input"
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
        <div className="text-2xl cyberpunk-text">Carregando...</div>
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