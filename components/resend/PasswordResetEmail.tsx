import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type PasswordResetEmailProps = {
  name: string;
  email: string;
  resetUrl: string;
};

export default function PasswordResetEmail({ name, email, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password for your account</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: '#f5f7fb', fontFamily: 'Arial' }}>
        <Container style={{ margin: '0 auto', padding: '32px 16px', maxWidth: '640px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <Heading style={{ margin: '0 0 16px', fontSize: '30px', lineHeight: '36px' }}>
              Reset your password
            </Heading>
            <Text
              style={{ margin: '0 0 12px', fontSize: '16px', lineHeight: '24px', color: '#374151' }}
            >
              Hi {name},
            </Text>
            <Text
              style={{ margin: '0 0 12px', fontSize: '16px', lineHeight: '24px', color: '#374151' }}
            >
              We received a password reset request for {email}. Use the link below to choose a new
              password.
            </Text>
            <Button
              href={resetUrl}
              style={{
                display: 'inline-block',
                backgroundColor: '#111827',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '14px 22px',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Reset password
            </Button>
            <Text
              style={{ margin: '18px 0 0', fontSize: '13px', lineHeight: '20px', color: '#6b7280' }}
            >
              If you used Google sign-in, there is no password to reset. Use the Google button on
              the login page instead.
            </Text>
            <Text
              style={{ margin: '6px 0 0', fontSize: '13px', lineHeight: '20px', color: '#2563eb' }}
            >
              {resetUrl}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
