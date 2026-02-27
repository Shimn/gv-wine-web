'use client';

import { useEffect, useState } from 'react';
import { useAuth, type Perfil } from '@/contexts/AuthContext';

const ROLE_CFG: Record<string, { label: string; color: string }> = {
  dono:     { label: 'Dono',     color: 'bg-amber-100 text-amber-800' },
  admin:    { label: 'Admin',    color: 'bg-purple-100 text-purple-700' },
  vendedor: { label: 'Vendedor', color: 'bg-blue-100 text-blue-700' },
  viewer:   { label: 'Viewer',   color: 'bg-gray-100 text-gray-600' },
};

export default function UsuariosPage() {
  const { perfil: meuPerfil } = useAuth();
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [loading, setLoading]   = useState(true);

  // Form novo usuário
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', password: '', role: 'vendedor' });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole]   = useState('');

  function fetchUsuarios() {
    setLoading(true);
    fetch('/api/usuarios')
      .then((r) => r.json())
      .then((d) => setUsuarios(d.usuarios ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchUsuarios(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.email || !form.password) return;
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { setMsg({ type: 'err', text: d.error }); return; }
      setMsg({ type: 'ok', text: '✅ Usuário criado!' });
      setForm({ nome: '', email: '', password: '', role: 'vendedor' });
      fetchUsuarios();
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateRole(id: string, role: string) {
    await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    setEditingId(null);
    fetchUsuarios();
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo }),
    });
    fetchUsuarios();
  }

  const isAdmin = meuPerfil?.role === 'admin' || meuPerfil?.role === 'dono';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-gray-900">👥 Usuários</h1>
          {isAdmin && (
            <button
              onClick={() => { setShowForm(!showForm); setMsg(null); }}
              className="text-xs bg-wine-700 text-white px-3 py-1.5 rounded-full hover:bg-wine-800 transition-colors"
            >
              {showForm ? 'Cancelar' : '+ Novo usuário'}
            </button>
          )}
        </div>

        {/* Formulário novo usuário */}
        {showForm && isAdmin && (
          <form onSubmit={handleCreate} className="mt-4 bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
                <input
                  type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wine-400"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                <input
                  type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wine-400"
                  placeholder="user@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Senha *</label>
                <input
                  type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wine-400"
                  placeholder="Min. 6 caracteres"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Papel</label>
                <select
                  value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wine-400"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="admin">Admin</option>
                  {meuPerfil?.role === 'dono' && <option value="dono">Dono</option>}
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>

            {msg && (
              <p className={`text-sm rounded-lg px-3 py-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {msg.text}
              </p>
            )}

            <button
              type="submit" disabled={saving || !form.nome || !form.email || !form.password}
              className="bg-wine-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-wine-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Criando…' : 'Criar usuário'}
            </button>
          </form>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-wine-700 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && usuarios.length === 0 && (
          <p className="text-center text-gray-400 py-8">Nenhum usuário cadastrado.</p>
        )}

        <div className="space-y-2">
          {usuarios.map((u) => {
            const cfg = ROLE_CFG[u.role] ?? ROLE_CFG.viewer;
            const isMe = u.id === meuPerfil?.id;

            return (
              <div key={u.id} className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 ${u.ativo ? 'border-gray-100' : 'border-red-100 opacity-60'}`}>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-wine-100 text-wine-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {u.nome.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.nome}</p>
                    {isMe && <span className="text-[10px] bg-wine-50 text-wine-600 rounded-full px-1.5 py-0.5">Você</span>}
                    {!u.ativo && <span className="text-[10px] bg-red-50 text-red-500 rounded-full px-1.5 py-0.5">Inativo</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>

                {/* Role badge / editor */}
                {editingId === u.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                    >
                      {meuPerfil?.role === 'dono' && <option value="dono">Dono</option>}
                      <option value="admin">Admin</option>
                      <option value="vendedor">Vendedor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleUpdateRole(u.id, editRole)}
                      className="text-xs bg-green-600 text-white rounded-lg px-2 py-1 hover:bg-green-700"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {isAdmin && !isMe && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingId(u.id); setEditRole(u.role); }}
                          className="text-[10px] text-gray-400 hover:text-gray-600"
                          title="Editar papel"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleToggleAtivo(u.id, !u.ativo)}
                          className="text-[10px] text-gray-400 hover:text-gray-600"
                          title={u.ativo ? 'Desativar' : 'Reativar'}
                        >
                          {u.ativo ? '🚫' : '✅'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
