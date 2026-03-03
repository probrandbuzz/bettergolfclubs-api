import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end();

  const config = {
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  const to = req.query.to as string || process.env.ADMIN_ALERT_EMAIL;

  try {
    const transporter = nodemailer.createTransport(config as any);
    
    // Verify connection first
    await transporter.verify();
    
    // Send test email
    const info = await transporter.sendMail({
      from: `"Better Golf Clubs" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Test Email — Better Golf Clubs API',
      html: `<p>SMTP is working correctly.</p>
             <p>Host: ${config.host}</p>
             <p>Port: ${config.port}</p>
             <p>Secure: ${config.secure}</p>
             <p>User: ${config.auth.user}</p>
             <p>Sent at: ${new Date().toISOString()}</p>`,
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      config: { host: config.host, port: config.port, secure: config.secure, user: config.auth.user }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: err.code,
      config: { host: config.host, port: config.port, secure: config.secure, user: config.auth.user }
    });
  }
}
