import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await request.json();

    const { type, subject, message, email, page, userAgent } = body;

    // Validation
    if (!type || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (subject.length > 100) {
      return NextResponse.json(
        { error: 'Subject too long (max 100 characters)' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    // Store feedback in Firebase
    const feedbackData = {
      type,
      subject: subject.trim(),
      message: message.trim(),
      email: email?.trim() || null,
      page: page || null,
      userAgent: userAgent || null,
      userId: session?.user?.email || 'anonymous',
      userName: session?.user?.name || null,
      status: 'new', // new, reviewed, resolved, archived
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'feedback'), feedbackData);

    console.log('Feedback submitted:', {
      id: docRef.id,
      type,
      subject,
      userId: feedbackData.userId,
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    // Only allow authenticated users to view feedback (admin feature)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This could be expanded to fetch and display feedback for admin users
    // For now, just return a simple message
    return NextResponse.json({
      message: 'Feedback API endpoint is active',
      info: 'Use POST to submit feedback',
    });
  } catch (error) {
    console.error('Error in feedback API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
