// Quick test to verify S3 posts work without data/posts.json
require('dotenv').config({ path: '.env.local' });

async function test() {
  try {
    // Set the env var
    process.env.NEXT_PUBLIC_USE_S3_POSTS = 'true';
    
    const { getAllPosts } = await import('./lib/posts-unified.ts');
    const posts = await getAllPosts();
    
    console.log(`✅ Success! Loaded ${posts.length} posts from S3`);
    console.log(`   First post: ${posts[0]?.title || 'N/A'}`);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    return false;
  }
}

test().then(success => {
  process.exit(success ? 0 : 1);
});

