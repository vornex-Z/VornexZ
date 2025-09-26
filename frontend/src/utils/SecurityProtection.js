/**
 * VornexZPay Bank-Grade Security Protection System
 * Implementa proteções contra captura de tela, gravação e outras ameaças
 */

class SecurityProtection {
  constructor() {
    this.init();
  }

  init() {
    this.preventScreenCapture();
    this.preventRecording();
    this.preventPrint();
    this.preventDevTools();
    this.preventRightClick();
    this.detectScreenCapture();
    this.monitorSecurity();
  }

  // Previne captura de tela
  preventScreenCapture() {
    // CSS que tenta esconder conteúdo em capturas
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        * { display: none !important; }
        body::after {
          content: "CAPTURA DE TELA PROIBIDA - VORNEXZPAY";
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 30px;
          color: red;
          z-index: 9999999;
        }
      }
      
      /* Tenta esconder elementos durante screenshots */
      .security-protected {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      }

      /* Anti-screenshot CSS */
      @media screen and (min-device-width: 0px) {
        .balance-display, .card-item {
          background-attachment: fixed;
          filter: contrast(1.2) brightness(1.1);
        }
      }
    `;
    document.head.appendChild(style);

    // Adiciona classe de proteção ao body
    document.body.classList.add('security-protected');

    // Detecta tentativas de screenshot via APIs
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = function() {
        console.warn('[SECURITY] Tentativa de captura de tela detectada');
        return Promise.reject(new Error('Captura de tela bloqueada por motivos de segurança'));
      };
    }
  }

  // Previne gravação de tela
  preventRecording() {
    // Bloqueia APIs de gravação
    if (window.MediaRecorder) {
      const originalMediaRecorder = window.MediaRecorder;
      window.MediaRecorder = function() {
        throw new Error('Gravação bloqueada por motivos de segurança');
      };
    }

    // Detecta mudanças de visibilidade que podem indicar gravação
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.warn('[SECURITY] Página minimizada - possível gravação');
      }
    });

    // Monitora performance para detectar gravação de tela
    if ('getEntriesByType' in performance) {
      setInterval(() => {
        const entries = performance.getEntriesByType('measure');
        if (entries.length > 100) {
          console.warn('[SECURITY] Performance anômala detectada');
        }
      }, 5000);
    }
  }

  // Previne impressão
  preventPrint() {
    // Bloqueia Ctrl+P
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        this.showSecurityAlert('Impressão não permitida');
        return false;
      }
    });

    // Bloqueia função de impressão do navegador
    window.print = function() {
      this.showSecurityAlert('Impressão bloqueada por motivos de segurança');
    }.bind(this);

    // CSS para ocultar conteúdo na impressão
    const printStyle = document.createElement('style');
    printStyle.media = 'print';
    printStyle.textContent = `
      * { visibility: hidden !important; }
      body::after {
        visibility: visible !important;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        content: "IMPRESSÃO PROIBIDA - VORNEXZPAY SISTEMA BANCÁRIO";
        font-size: 24px;
        font-weight: bold;
        color: red;
      }
    `;
    document.head.appendChild(printStyle);
  }

  // Previne ferramentas de desenvolvedor (menos agressivo em desenvolvimento)
  preventDevTools() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Só bloqueia teclas em produção
    if (isProduction) {
      // Bloqueia F12
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.key === 'U')) {
          e.preventDefault();
          e.stopPropagation();
          this.showSecurityAlert('Ferramentas de desenvolvedor bloqueadas');
          return false;
        }
      });
    } else {
      // Em desenvolvimento, apenas loga
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F12') {
          console.log('[DEV MODE] F12 detectado - DevTools liberado para desenvolvimento');
        }
      });
    }

    // Detecta se DevTools está aberto (modo menos intrusivo para desenvolvimento)
    let devtools = {
      open: false,
      orientation: null
    };
    
    if (isProduction) {
      const threshold = 160;
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          if (!devtools.open) {
            devtools.open = true;
            console.warn('[SECURITY] DevTools detectado');
            // Só mostra alerta em produção
            this.showSecurityAlert('Ferramentas de desenvolvedor detectadas');
          }
        } else {
          devtools.open = false;
        }
      }, 500);
    }

    // Detecta debug via console (modo menos agressivo)
    const originalConsole = console.log;
    let consoleAccessCount = 0;
    
    console.log = function() {
      consoleAccessCount++;
      if (consoleAccessCount > 10) {
        console.warn('[SECURITY] Acesso excessivo ao console detectado');
        consoleAccessCount = 0; // Reset counter
      }
      return originalConsole.apply(console, arguments);
    };
  }

  // Previne clique direito
  preventRightClick() {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showSecurityAlert('Menu de contexto desabilitado');
      return false;
    });

    // Bloqueia seleção de texto
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    });

    // Bloqueia arrastar elementos
    document.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    });
  }

  // Detecta tentativas de captura
  detectScreenCapture() {
    // Monitor mudanças na janela
    window.addEventListener('blur', () => {
      console.warn('[SECURITY] Janela perdeu foco - possível captura');
    });

    // Monitor redimensionamento
    window.addEventListener('resize', () => {
      const threshold = 50;
      if (Math.abs(window.innerWidth - window.screen.width) > threshold ||
          Math.abs(window.innerHeight - window.screen.height) > threshold) {
        console.warn('[SECURITY] Redimensionamento anômalo detectado');
      }
    });
  }

  // Sistema de monitoramento contínuo
  monitorSecurity() {
    setInterval(() => {
      // Verifica se elementos de segurança ainda estão presentes
      const watermark = document.querySelector('.security-watermark');
      if (!watermark) {
        this.addWatermark();
      }

      // Verifica manipulação do DOM
      if (!document.body.classList.contains('security-protected')) {
        document.body.classList.add('security-protected');
      }

      // Monitora uso de CPU (pode indicar gravação)
      if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        if (memory.usedJSHeapSize / memory.totalJSHeapSize > 0.9) {
          console.warn('[SECURITY] Uso de memória elevado detectado');
        }
      }
    }, 3000);

    // Monitora tentativas de manipulação
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.target.classList && 
            mutation.target.classList.contains('security-watermark')) {
          console.warn('[SECURITY] Tentativa de manipulação da marca d\'água');
          this.addWatermark();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });
  }

  // Exibe alertas de segurança (menos intrusivo em desenvolvimento)
  showSecurityAlert(message) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Em desenvolvimento, só loga no console
    if (!isProduction) {
      console.warn(`[VORNEXZPAY SECURITY - DEV] ${message}`);
      return;
    }
    
    // Em produção, mostra alerta visual
    console.warn(`[VORNEXZPAY SECURITY] ${message}`);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(239, 68, 68, 0.95);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      z-index: 1000001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.textContent = `🔒 ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Método para desabilitar proteções (para desenvolvimento)
  disable() {
    console.warn('[SECURITY] Proteções de segurança desabilitadas');
    // Aqui poderia implementar lógica para remover proteções se necessário
  }
}

export default SecurityProtection;