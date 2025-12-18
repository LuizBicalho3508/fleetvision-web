import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full border-l-4 border-red-500">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Ops! Algo deu errado.</h1>
            <p className="text-slate-500 mb-4">O sistema encontrou um erro crítico e não pôde carregar.</p>
            
            <div className="bg-slate-900 text-red-400 p-4 rounded-lg overflow-auto text-xs font-mono max-h-60 mb-4">
              <p className="font-bold border-b border-slate-700 pb-2 mb-2">{this.state.error && this.state.error.toString()}</p>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </div>

            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Tentar Recarregar Página
            </button>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }} 
              className="ml-4 text-slate-500 underline hover:text-red-500 text-sm"
            >
              Limpar Cache Local e Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
