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

type VerifyEmailEmailProps = {
  name: string;
  email: string;
  verificationUrl: string;
};

export default function VerifyEmailEmail({ name, email, verificationUrl }: VerifyEmailEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address to finish creating your account</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: '#f5f7fb', fontFamily: 'Arial' }}>
        <Container style={{ margin: '0 auto', padding: '32px 16px', maxWidth: '640px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px' }}>
            <Heading style={{ margin: '0 0 16px', fontSize: '30px', lineHeight: '36px' }}>
              Verify your email address
            </Heading>
            <Text
              style={{ margin: '0 0 12px', fontSize: '16px', lineHeight: '24px', color: '#374151' }}
            >
              Hi {name},
            </Text>
            <Text
              style={{ margin: '0 0 12px', fontSize: '16px', lineHeight: '24px', color: '#374151' }}
            >
              We received a registration for {email}. Confirm your email address to finish creating
              your account.
            </Text>
            <Button
              href={verificationUrl}
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
              Verify email
            </Button>
            <Text
              style={{ margin: '18px 0 0', fontSize: '13px', lineHeight: '20px', color: '#6b7280' }}
            >
              If the button does not work, open this link:
            </Text>
            <Text
              style={{ margin: '6px 0 0', fontSize: '13px', lineHeight: '20px', color: '#2563eb' }}
            >
              {verificationUrl}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
