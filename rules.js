const im_windows = [
    {
      function: 'get_title',
      pattern: /^Hangout/
    },
    {
      function: 'get_title',
      pattern: /^.*WhatsApp$/
    },
    {
      function: 'get_title',
      pattern: /^Brick: /
    },
    {
      function: 'get_title',
      pattern: /^Telegram/
    },
    {
      function: 'get_title',
      pattern: /^Google.{0,}Hangouts/
    },
    {
      function: 'get_title',
      pattern: /^Google\sHangouts/
    },
    {
      function: 'get_title',
      pattern: /^YakYak/
    },
    {
      function: 'get_wm_class',
      pattern: /^Skype/
    },
    {
      function: 'get_title',
      pattern: /^Skype/
    },
    {
      function: 'get_wm_class',
      pattern: /^skypeforlinux/
    },
    {
      function: 'get_wm_class',
      pattern: /^Empathy/
    },
    {
      function: 'get_wm_class',
      pattern: /^Pidgin/
    },
    {
      function: 'get_wm_class',
      pattern: /^crx_oonccmmafcaodljbcgobdbknmbljiafh/
    },
    {
      function: 'get_wm_class',
      pattern: /^ViberPC/
    },
    {
      function: 'get_wm_class',
      pattern: /^Slack/
    }];
var rules = {
    'all':  {
    },
    'im': {
      stick: true,
      name: 'im',
      include: im_windows
    },
    'not_im': {
      name: 'not_im',
      exclude: im_windows
    }
  };