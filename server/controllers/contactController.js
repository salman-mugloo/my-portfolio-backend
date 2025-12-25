import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

// @desc    Send contact message
export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        message: 'All fields are required',
        errors: {
          name: !name ? 'Name is required' : null,
          email: !email ? 'Email is required' : null,
          message: !message ? 'Message is required' : null
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format',
        errors: { email: 'Please enter a valid email address' }
      });
    }

    // Validate message length (max 5000 characters)
    if (message.length > 5000) {
      return res.status(400).json({ 
        message: 'Message is too long',
        errors: { message: 'Message must be less than 5000 characters' }
      });
    }

    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.error('Email credentials not configured');
      return res.status(500).json({ 
        message: 'Email service is not configured. Please contact the administrator.' 
      });
    }

    // Create transporter
    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: 'mugloosalman@gmail.com',
      subject: `Portfolio Contact: Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; color: #ffffff; border-radius: 8px;">
          <h2 style="color: #10b981; margin-bottom: 20px;">New Contact Form Message</h2>
          
          <div style="background-color: #262626; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 10px 0;"><strong style="color: #10b981;">Name:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong style="color: #10b981;">Email:</strong> ${email}</p>
          </div>
          
          <div style="background-color: #262626; padding: 20px; border-radius: 8px;">
            <h3 style="color: #10b981; margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #333; font-size: 12px; color: #888;">
            <p>This message was sent from your portfolio contact form.</p>
            <p>Reply directly to this email to respond to ${name} (${email})</p>
          </div>
        </div>
      `,
      replyTo: email
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'Message sent successfully! I\'ll get back to you soon.' 
    });

  } catch (error) {
    console.error('Error sending contact message:', error);
    
    // Handle specific nodemailer errors
    if (error.code === 'EAUTH') {
      return res.status(500).json({ 
        message: 'Email authentication failed. Please contact the administrator.' 
      });
    }

    res.status(500).json({ 
      message: 'Failed to send message. Please try again later.' 
    });
  }
};

