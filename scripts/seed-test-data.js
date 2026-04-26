#!/usr/bin/env node

/**
 * Seed Test Data into Supabase
 * 
 * This script:
 * 1. Creates a test user (or uses existing)
 * 2. Adds sample books to the database
 * 3. Adds user_books entries for testing
 * 4. Sets up reading goals
 * 
 * Usage: node scripts/seed-test-data.js [--userId=UUID]
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qgoermeodyyfrfoyvnvo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_TIjb7yhm4CGQOcWgybqF8g_Fvq2kxYg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Sample books data
const BOOKS = [
  {
    title: 'The Silent Patient',
    author_name: 'Alex Michaelides',
    description: 'A shocking psychological thriller about a woman who shoots her husband and never speaks again.',
    publish_date: '2019-02-06',
    cover_image_url: 'https://storage.googleapis.com/banani-generated-images/generated-images/64482471-c91c-4668-b6f2-0b0db8a3d125.jpg',
  },
  {
    title: 'The Maid',
    author_name: 'Nita Prose',
    description: 'A masterful debut mystery featuring Molly, a maid at the prestigious Bellamy Hotel.',
    publish_date: '2022-08-02',
    cover_image_url: 'https://storage.googleapis.com/banani-generated-images/generated-images/08ab14c7-8ba7-43e7-8f04-4b47276a3634.jpg',
  },
  {
    title: 'Yellowface',
    author_name: 'R.F. Kuang',
    description: 'A scorching satire about identity, ambition, and the publishing industry.',
    publish_date: '2023-05-16',
    cover_image_url: 'https://storage.googleapis.com/banani-generated-images/generated-images/0c71efb7-0092-41d5-a3f4-e4450155e530.jpg',
  },
  {
    title: 'Happy Place',
    author_name: 'Emily Henry',
    description: 'Two exes must pretend to be a couple at a beach resort in this romantic comedy.',
    publish_date: '2023-06-06',
    cover_image_url: 'https://storage.googleapis.com/banani-generated-images/generated-images/a2727c5f-e372-481d-a0e8-5ba63dfdef0b.jpg',
  },
  {
    title: 'Babel',
    author_name: 'R.F. Kuang',
    description: 'An alternate history novel set in a version of Oxford where magical translation is power.',
    publish_date: '2022-08-30',
    cover_image_url: 'https://storage.googleapis.com/banani-generated-images/generated-images/48a006e9-223c-495f-8f72-9968d0df8216.jpg',
  },
  {
    title: 'None of This Is True',
    author_name: 'Lisa Jewell',
    description: 'A psychological thriller about a struggling novelist who meets a mysterious woman.',
    publish_date: '2022-05-17',
    cover_image_url: 'https://storage.googleapis.com/banani-generated-images/generated-images/dc1d1c34-e39b-4eb3-80d6-030d12105f2e.jpg',
  },
  {
    title: 'Demon Copperhead',
    author_name: 'Barbara Kingsolver',
    description: 'A reimagining of David Copperfield set in Appalachia.',
    publish_date: '2022-08-02',
    cover_image_url: 'https://storage.googleapis.com/banani-generated-images/generated-images/47c9689e-8f30-4617-a399-1f1894ec550d.jpg',
  },
  {
    title: 'Lessons in Chemistry',
    author_name: 'Bonnie Garmus',
    description: 'A historical fiction novel set in the 1960s about a female chemist.',
    publish_date: '2022-03-08',
    cover_image_url: 'https://storage.googleapis.com/banani-generated-images/generated-images/a00aa3f5-cb71-4e96-ba5a-06a924d125e9.jpg',
  },
  {
    title: 'The Covenant of Water',
    author_name: 'Abraham Verghese',
    description: 'An epic multigenerational novel set in India.',
    publish_date: '2023-10-03',
    cover_image_url: 'https://storage.googleapis.com/banani-generated-images/generated-images/e1d0cd05-522e-450d-b909-783a5d3f02b7.jpg',
  },
  {
    title: 'Tomorrow, and Tomorrow, and Tomorrow',
    author_name: 'Gabrielle Zevin',
    description: 'A sweeping novel about friendship between two video game designers.',
    publish_date: '2022-07-05',
    cover_image_url: 'https://storage.googleapis.com/banani-generated-images/generated-images/5bb029c2-b31f-404d-a821-5f61a648e3b3.jpg',
  },
];

const GENRES = ['thriller', 'mystery', 'romance', 'fiction', 'science-fiction', 'fantasy', 'historical-fiction'];

// Reading statuses
const READING_STATUSES = {
  READING: 'reading',
  COMPLETED: 'completed',
  WANT_TO_READ: 'want_to_read',
  DROPPED: 'dropped',
};

async function main() {
  try {
    console.log('🚀 Starting test data seeding...\n');

    // Step 1: Ensure reading statuses exist
    console.log('📋 Setting up reading statuses...');
    const { error: statusError } = await supabase.from('reading_statuses').upsert(
      Object.values(READING_STATUSES).map((name) => ({ status_name: name })),
      { onConflict: 'status_name' }
    );
    if (statusError) throw statusError;
    console.log('✅ Reading statuses ready\n');

    // Step 2: Add books
    console.log('📚 Adding sample books...');
    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .upsert(BOOKS, { onConflict: 'title' })
      .select();
    if (booksError) throw booksError;
    console.log(`✅ Added ${booksData?.length || 0} books\n`);

    // Step 3: Add genres
    console.log('🏷️  Setting up genres...');
    const { error: genreError } = await supabase.from('genres').upsert(
      GENRES.map((name) => ({ genre_name: name })),
      { onConflict: 'genre_name' }
    );
    if (genreError) throw genreError;
    console.log('✅ Genres ready\n');

    // Step 4: Get current user
    console.log('👤 Fetching current user...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('❌ No authenticated user found. Please sign in first!');
      process.exit(1);
    }

    const userId = userData.user.id;
    console.log(`✅ User: ${userData.user.email}\n`);

    // Step 5: Update user profile
    console.log('📝 Updating user profile...');
    const { error: profileError } = await supabase.from('users').upsert(
      {
        id: userId,
        email: userData.user.email,
        name: userData.user.user_metadata?.name || 'Test Reader',
        about_me: 'Passionate reader and book lover. Testing the ReadTrack platform!',
        profile_picture_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        username: `test_reader_${Date.now()}`,
      },
      { onConflict: 'id' }
    );
    if (profileError) throw profileError;
    console.log('✅ User profile updated\n');

    // Step 6: Add reading goal
    console.log('🎯 Setting reading goal...');
    const currentYear = new Date().getFullYear();
    const { error: goalError } = await supabase.from('reading_goals').upsert(
      {
        user_id: userId,
        year: currentYear,
        target_books: 50,
      },
      { onConflict: ['user_id', 'year'] }
    );
    if (goalError) throw goalError;
    console.log('✅ Reading goal set (50 books in 2026)\n');

    // Step 7: Add user books
    console.log('📖 Adding books to user library...');
    const { data: statusData } = await supabase.from('reading_statuses').select('*');
    const statuses = statusData || [];

    const statusMap = {
      READING: statuses.find((s) => s.status_name === 'reading')?.status_id || 1,
      COMPLETED: statuses.find((s) => s.status_name === 'completed')?.status_id || 2,
      WANT_TO_READ: statuses.find((s) => s.status_name === 'want_to_read')?.status_id || 3,
    };

    const userBooks = booksData?.slice(0, 8).map((book, index) => {
      let statusId = statusMap.WANT_TO_READ;
      let rating = null;
      let readAt = null;

      if (index < 2) {
        statusId = statusMap.READING;
      } else if (index < 5) {
        statusId = statusMap.COMPLETED;
        rating = Math.floor(Math.random() * 2) + 4; // 4 or 5
        readAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString();
      }

      return {
        user_id: userId,
        book_id: book.book_id,
        status_id: statusId,
        rating,
        note: 'Great book!',
        added_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        read_at: readAt,
      };
    });

    const { data: userBooksData, error: userBooksError } = await supabase
      .from('user_books')
      .upsert(userBooks || [], { onConflict: ['user_id', 'book_id'] })
      .select();

    if (userBooksError) throw userBooksError;
    console.log(`✅ Added ${userBooksData?.length || 0} books to library\n`);

    console.log('🎉 Test data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  - Books: ${booksData?.length || 0}`);
    console.log(`  - User books: ${userBooksData?.length || 0}`);
    console.log(`  - User email: ${userData.user.email}`);
    console.log(`  - Reading goal: 50 books in ${currentYear}\n`);
    console.log('🚀 You can now test the home page and profile page!\n');
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
}

main();
