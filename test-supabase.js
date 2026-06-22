const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, './.env.local');
let envConfig = {};
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      envConfig[match[1]] = (match[2] || '').trim();
    }
  });
} catch (err) {
  process.exit(1);
}

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testSessionCreation() {
  const dummyUserId = "00000000-0000-0000-0000-000000000000";
  console.log("Inserting section 'image' with dummy user...");
  const { error: errImage } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: dummyUserId,
      section: 'image',
      title: 'Test Image'
    });
  
  console.log("Error for 'image' section:", errImage?.message);

  console.log("Inserting section 'chat' with dummy user...");
  const { error: errChat } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: dummyUserId,
      section: 'chat',
      title: 'Test Chat'
    });
  
  console.log("Error for 'chat' section:", errChat?.message);
}

testSessionCreation();
