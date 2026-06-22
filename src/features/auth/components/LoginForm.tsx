import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/feedback/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './LoginForm.module.css';

const loginSchema = z.object({
  login: z.string().min(3, 'Login kamida 3 belgidan iborat bo\'lishi kerak'),
  password: z.string().min(8, 'Parol kamida 8 belgidan iborat bo\'lishi kerak'),
});

export function LoginForm() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ login, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const path = await authLogin({ login, password });
      showToast('Muvaffaqiyatli kirdingiz', 'success');
      navigate(path);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Kirish amalga oshmadi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        label="Login"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        error={errors.login}
        autoComplete="username"
        placeholder="superadmin"
      />
      <Input
        label="Parol"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        autoComplete="current-password"
        placeholder="••••••••"
      />
      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? 'Kirish...' : 'Kirish'}
      </Button>
    </form>
  );
}
