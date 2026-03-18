import * as React from "react"
import { useGetAdminReports, useAdminDeleteReceita, useBanUsuario, useGetMe, getGetAdminReportsQueryKey } from "@workspace/api-client-react"
import { Sidebar } from "@/components/Sidebar"
import { ShieldAlert, Trash2, Ban, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "wouter"

export default function Moderation() {
  const { data: user } = useGetMe({ query: { retry: false } })
  const { data: reports, isLoading } = useGetAdminReports({ query: { enabled: user?.papel === 'adm' } })
  const { mutate: deleteRecipe } = useAdminDeleteReceita()
  const { mutate: banUser } = useBanUsuario()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const handleDelete = (id: number) => {
    if(confirm("Excluir definitivamente esta receita?")) {
      deleteRecipe({ id }, {
        onSuccess: () => {
          toast({ title: "Receita excluída" })
          queryClient.invalidateQueries({ queryKey: getGetAdminReportsQueryKey() })
        }
      })
    }
  }

  const handleBan = (id: number, name: string) => {
    if(confirm(`Banir o usuário ${name}? Ele não poderá mais logar.`)) {
      banUser({ id }, {
        onSuccess: () => {
          toast({ title: "Usuário banido", variant: "destructive" })
          queryClient.invalidateQueries({ queryKey: getGetAdminReportsQueryKey() })
        }
      })
    }
  }

  if (user && user.papel !== 'adm') {
    return <div className="p-10 text-center font-bold text-2xl">Acesso Negado</div>
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <Sidebar 
        user={user}
        search="" setSearch={() => {}}
        activeFeed="recentes" setActiveFeed={() => {}}
        setCategoriaId={() => {}}
        onNewRecipe={() => {}} onNewCategory={() => {}}
      />

      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-muted/20">
        <div className="p-8 md:p-12 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-4xl font-display font-bold text-foreground">Painel de Moderação</h2>
              <p className="text-muted-foreground mt-1 text-lg">Gerencie denúncias e usuários da comunidade.</p>
            </div>
          </div>

          <div className="bg-card border border-border shadow-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4">Receita</th>
                    <th className="px-6 py-4">Autor</th>
                    <th className="px-6 py-4 text-center">Denúncias</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isLoading ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Carregando...</td></tr>
                  ) : reports?.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center font-medium text-muted-foreground">Nenhuma denúncia pendente. Tudo limpo! ✨</td></tr>
                  ) : reports?.map(report => (
                    <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{report.titulo}</div>
                        <div className="text-xs text-muted-foreground">{report.categoria?.nome}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/usuario/${report.autorId}`} className="flex items-center gap-2 hover:text-primary">
                          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                            {report.autor?.nome?.charAt(0)}
                          </div>
                          <span className="font-medium">{report.autor?.nome}</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 font-bold">
                          {report.reportCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleDelete(report.id)} className="text-destructive hover:bg-destructive/10 hover:border-destructive/30">
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir Receita
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleBan(report.autorId, report.autor?.nome || '')} className="text-destructive hover:bg-destructive/10 hover:border-destructive/30">
                          <Ban className="w-4 h-4 mr-2" /> Banir Autor
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
