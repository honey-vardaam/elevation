import { Form, Head } from '@inertiajs/react';
import { Field } from '@/components/field';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <>
            <Head title="Sign up" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            <Field
                                htmlFor="name"
                                label="Full name"
                                required
                                error={errors.name}
                            >
                                <Input
                                    id="name"
                                    type="text"
                                    name="name"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    placeholder="Sarah Jenkins"
                                    className="h-10 rounded-xl"
                                />
                            </Field>

                            <Field
                                htmlFor="email"
                                label="Work email"
                                required
                                error={errors.email}
                            >
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    placeholder="sarah@elevation.studio"
                                    className="h-10 rounded-xl"
                                />
                            </Field>

                            <Field
                                htmlFor="password"
                                label="Password"
                                required
                                error={errors.password}
                            >
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    placeholder="Create a strong password"
                                    className="h-10 rounded-xl"
                                />
                            </Field>

                            <Field
                                htmlFor="password_confirmation"
                                label="Confirm password"
                                required
                                error={errors.password_confirmation}
                            >
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    placeholder="Repeat your password"
                                    className="h-10 rounded-xl"
                                />
                            </Field>

                            <Button
                                type="submit"
                                className="mt-2 h-10 w-full rounded-xl font-medium shadow-sm transition-all"
                                tabIndex={5}
                                disabled={processing}
                                data-test="register-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-muted-foreground mt-2 text-center text-sm">
                            Already have an account?{' '}
                            <TextLink
                                href={login()}
                                className="text-foreground font-medium hover:underline"
                                tabIndex={6}
                            >
                                Sign in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Get started with Elevation for your architectural projects',
};
