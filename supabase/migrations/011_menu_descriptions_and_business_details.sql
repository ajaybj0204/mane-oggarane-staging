-- Menu descriptions + restaurant business details (1 Nov 2026).
-- Descriptions describe each dish's traditional style. They intentionally make no
-- allergen, nutrition or exact-recipe claims: the kitchen must confirm those per dish.
-- Idempotent: safe to re-run. Rollback: set description = null / restore previous settings JSON.
update public.products p set description=d.description from (values
 ('v1','Davangere-style butter dosa — crisp at the edges, soft inside and cooked with a generous spread of benne (butter).'),
 ('v2','A golden Mysuru classic: dosa lined with spicy red chutney and folded around a soft, mildly spiced potato palya.'),
 ('v3','Plate-sized, pillowy thatte idli in the Bidadi style, paired with a crisp, golden urad-dal vada.'),
 ('v4','Fragrant rice and garden vegetables layered with whole spices and slow-cooked on dum.'),
 ('v5','Soft paneer tossed in a tangy, fiery red masala of roasted chillies and spices, finished in ghee — coastal Karnataka style.'),
 ('v6','A homestyle full meal of rice with an assortment of the day''s curries, sides and accompaniments.'),
 ('v7','Crisp fried cauliflower tossed with curry leaves and green chillies in a tangy, spiced coating — a Mangaluru-style starter.'),
 ('v8','Mildly spiced rice cooked with vegetables and whole spices — light, aromatic and comforting.'),
 ('nv1','Bengaluru military-hotel style biryani made with short-grain rice and a herby green masala of mint, coriander and green chillies.'),
 ('nv2','Ambur-style chicken biryani — tender chicken and short-grain rice cooked together in a robust red-chilli masala.'),
 ('nv3','Rustic country-chicken curry cooked the nati way in a freshly ground spice and coconut masala. Best with rice.'),
 ('nv4','Coastal Kundapur-style chicken curry in a roasted red chilli, coriander and coconut masala — rich, aromatic and gently tangy.'),
 ('nv5','Juicy chicken bites marinated in spices and fried crisp, finished with curry leaves and green chillies.'),
 ('nv6','Tender mutton dry-roasted with onions, coconut and a fragrant blend of roasted spices.'),
 ('nv7','Fish marinated in a spicy red masala and pan-fried until crisp at the edges.'),
 ('nv8','Boiled eggs roasted in a thick, spicy onion-tomato masala.'),
 ('c1','A vegetarian spread served on a banana leaf — rice with a selection of the day''s curries and sides.'),
 ('c2','A hearty non-vegetarian combo bringing together a selection of our meat specials with rice.'),
 ('c3','A filling assortment of South Indian tiffin favourites — ideal for breakfast or a light meal.'),
 ('c4','A large biryani spread made for sharing with family and friends — a weekend favourite.'),
 ('c5','Cooling tempered curd rice paired with a spicy roast on the side — comfort and heat in one box.'),
 ('c6','A wholesome morning box of South Indian breakfast favourites.'),
 ('s1','Strong South Indian filter-coffee decoction with hot, frothy milk, served the traditional way.'),
 ('s2','Crushed puris topped with a warm, spiced peas gravy, onions, chutneys and sev — a Bengaluru chaat favourite.'),
 ('s3','Crisp hollow puris filled with spiced potato and tangy, minty pani — best eaten in one bite.'),
 ('s4','Puffed rice tossed with onions, tomatoes, chutneys and crunchy sev — light, tangy and crunchy.'),
 ('s5','A soft bun spread with butter and fruit jam — a classic bakery-café treat with kaapi.'),
 ('s6','Crisp, flat fritters from Maddur, made with rice flour, semolina and onions.'),
 ('s7','The royal Mysuru sweet of gram flour, ghee and sugar — rich and melt-in-the-mouth.'),
 ('s8','Semolina cooked with ghee and sugar and flavoured with cardamom — a traditional Karnataka sweet.'),
 ('s9','Freshly pressed sugarcane juice — naturally sweet and refreshing.'),
 ('s10','Chilled milk enriched with almonds, lightly sweetened and flavoured with cardamom.')
) as d(id,description) where p.id=d.id;

-- Approved business details. Phone/email/FSSAI stay blank until the owner provides them;
-- the website hides blank fields instead of showing placeholders.
update public.settings set value = value || jsonb_build_object(
 'hours','Monday to Sunday, 9:00 AM – 10:00 PM',
 'opening_time','09:00','closing_time','22:00','timezone','Asia/Kolkata',
 'address','Jigani APC Circle, Bannerghatta–Anekal Road, Jigani Industrial Area Phase 1, Ittina Nagar, Jigani, Anekal Taluk, Bengaluru, Karnataka 560105',
 'support_email', coalesce(value->>'support_email',''),
 'fssai_number', coalesce(value->>'fssai_number','')
) where key='store';
