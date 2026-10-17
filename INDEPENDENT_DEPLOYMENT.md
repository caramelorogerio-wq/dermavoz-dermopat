# Deploy independente: Vercel + Supabase

1. Crie projetos Supabase separados para staging e produção e aplique as migrações em `supabase/migrations`.
2. Em Authentication, configure o URL de produção e os redirect URLs de staging/produção; ative Google somente depois de configurar as credenciais OAuth no Supabase.
3. Na Vercel, importe esta branch e defina as variáveis listadas em `.env.example`. Nunca use o prefixo `VITE_` para chaves de servidor ou para `DIGIVOZ_AI_KEY`.
4. Valide a preview deployment com duas contas diferentes. Confirme que a base tem somente `medicos` e `termos_aprendidos` e que RLS impede o acesso cruzado.
5. Importe apenas utilizadores médicos e `termos_aprendidos`. Não importe pacientes, relatórios, áudios, transcrições ou Storage.
6. Só depois de validar a produção, altere o DNS. Mantenha Lovable ativo para rollback.

O Cloudflare Worker não é criado, alterado ou publicado por este repositório. A aplicação comunica com ele apenas pelas variáveis `DIGIVOZ_AI_URL` e `DIGIVOZ_AI_KEY` no servidor.
