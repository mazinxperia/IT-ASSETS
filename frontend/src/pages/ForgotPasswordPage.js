import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { authAPI } from '../services/api';
import { toast } from 'sonner';
import { useBranding } from '../context/BrandingContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { branding } = useBranding();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSubmitted(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      toast.error('Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-white/10 bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-2">
              <Mail className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {submitted ? 'Check Your Email' : 'Forgot Password'}
            </CardTitle>
            <CardDescription>
              {submitted
                ? 'We\'ve sent password reset instructions to your email address.'
                : 'Enter your email address and we\'ll send you instructions to reset your password.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Instructions'}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  If an account exists with the email <strong>{email}</strong>, you will receive password reset instructions shortly.
                </p>
                <p className="text-xs text-muted-foreground">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>
            )}

            <div className="text-center">
              <Link to="/login" className="inline-flex items-center text-sm text-primary hover:underline">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-white/60 mt-6">
          © 2025 {branding.appName || 'AssetFlow'}. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
