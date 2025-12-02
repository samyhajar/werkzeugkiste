# Cloudinary ALT Text Implementation Guide

## Overview

This document outlines how to add ALT text support for images from Cloudinary to improve accessibility (Barrierefreiheit) for the Werkzeugkiste platform.

## Current Image Usage

The application currently uses images from Cloudinary in several places:

1. **Partner Logos** (`src/components/shared/PartnerSection.tsx`)
   - Already has proper ALT text implemented
   - Example: `alt="Bundeskanzleramt"`, `alt="Digital Austria"`, etc.

2. **Digi-Sammlung Resource Images** (`src/app/digi-sammlung/`)
   - Currently uses: `<img src={r.logo_url} alt={r.title} />`
   - ALT text is dynamically generated from resource title ✓

3. **Module Hero Images** (`src/components/shared/ModuleCard.tsx`, `src/components/shared/ModuleOverlay.tsx`)
   - Uses Next.js Image component with: `alt={module.title}`
   - ALT text is dynamically generated from module title ✓

4. **Lesson Content Images** (embedded in rich text)
   - Images are embedded in HTML content via the rich text editor
   - Currently may lack proper ALT attributes

## Implementation Strategy

### Phase 1: Cloudinary Metadata (RECOMMENDED)

**You can start adding ALT text metadata to Cloudinary images NOW.**

Cloudinary supports storing metadata (including ALT text) directly with each image. This is the recommended approach:

1. **In Cloudinary Console:**
   - Navigate to each image
   - Add a "context" metadata field called `alt`
   - Example: `alt=Ein Trainer erklärt digitale Grundlagen an einem Computer`

2. **Fetch ALT text via API:**
   ```javascript
   // Example: Fetching image with context metadata
   const response = await fetch(
     `https://res.cloudinary.com/${cloudName}/image/upload/fl_getinfo/${publicId}.json`
   )
   const data = await response.json()
   const altText = data.context?.custom?.alt || 'Bild'
   ```

### Phase 2: Rich Text Editor Enhancement

Update the rich text editor to require/suggest ALT text when inserting images:

**File:** `src/components/ui/rich-text-editor.tsx`

Add an ALT text input field in the image dialog (around line 492):

```tsx
// Add state for ALT text
const [imageAlt, setImageAlt] = useState('')

// In the dialog:
<div className="grid gap-2">
  <Label htmlFor="image-alt">ALT Text (für Barrierefreiheit)</Label>
  <Input
    id="image-alt"
    value={imageAlt}
    onChange={e => setImageAlt(e.target.value)}
    placeholder="Beschreibung des Bildes für Screenreader"
  />
</div>

// When adding the image:
const imageAttributes: any = {
  src: imageUrl,
  alt: imageAlt || 'Bild'
}
```

### Phase 3: Database Schema Update (Optional)

If you want to store ALT text separately in your database:

```sql
-- Add alt_text column to relevant tables
ALTER TABLE digi_resources
ADD COLUMN logo_alt_text TEXT;

ALTER TABLE digi_slides
ADD COLUMN image_alt_text TEXT;

-- For module hero images
ALTER TABLE modules
ADD COLUMN hero_image_alt TEXT;
```

## Priority Actions

### Immediate (Can Start Now - 0h development):

✅ **Add ALT text to Cloudinary images directly via Cloudinary console**

- Go to each image in Cloudinary Media Library
- Add context metadata: `alt = "Beschreibung des Bildes"`
- No code changes needed yet!

### Short-term (2h development estimate):

1. Update rich text editor to include ALT text input field
2. Ensure all `<img>` tags in rendered content have ALT attributes
3. Add validation to warn admins when ALT text is missing

### Medium-term (Optional):

1. Create a migration script to fetch ALT text from Cloudinary metadata
2. Store ALT text in database for faster access
3. Create an admin interface to manage ALT text for existing images

## Testing Accessibility

Test with screen readers:

- **macOS:** VoiceOver (Cmd + F5)
- **Windows:** NVDA (free) or JAWS
- **Chrome DevTools:** Lighthouse Accessibility Audit

## Best Practices for ALT Text

1. **Be Descriptive but Concise:**
   - Good: "Eine Trainerin zeigt einer Gruppe digitale Tools auf einem Laptop"
   - Bad: "Bild" or ""

2. **Context Matters:**
   - Decorative images: `alt=""` (empty but present)
   - Informative images: Describe the content
   - Functional images (buttons): Describe the action

3. **Avoid Redundancy:**
   - Don't start with "Bild von..." or "Foto von..."
   - Screen readers already announce it's an image

## Cost Estimate

- **Adding ALT text to Cloudinary:** 0€ (you can do this yourself now)
- **Rich text editor enhancement:** ~2 hours development
- **Database schema updates:** ~1 hour (if needed)
- **Admin interface for ALT text:** ~2-3 hours (optional)

**Total estimated:** 2-6 hours depending on scope

## Action Items for Martina

**You CAN start immediately (no waiting needed):**

1. Log into Cloudinary
2. Go to Media Library
3. For each image:
   - Click on the image
   - Add "Context" metadata
   - Add field: `alt` with German description
   - Save

**Example ALT texts for common images:**

- Partner logos: Company/organization name
- Module images: Brief description of what's shown
- Icon images: Purpose/function of the icon
- Decorative images: Leave empty `alt=""`

## Technical Implementation Notes

### Current Image Locations to Check:

1. ✅ `src/components/shared/PartnerSection.tsx` - Already has ALT text
2. ✅ `src/app/digi-sammlung/page.tsx` - Uses resource title as ALT
3. ✅ `src/components/shared/ModuleCard.tsx` - Uses module title as ALT
4. ⚠️ `src/components/ui/rich-text-editor.tsx` - Needs enhancement
5. ⚠️ Lesson content HTML - Needs validation for existing content

### Example: Fetching ALT from Cloudinary

```typescript
// Helper function to get image URL with ALT text from Cloudinary
async function getCloudinaryImageWithAlt(publicId: string) {
  const infoUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/fl_getinfo/${publicId}.json`

  try {
    const response = await fetch(infoUrl)
    const data = await response.json()

    return {
      url: data.secure_url,
      alt: data.context?.custom?.alt || '',
      width: data.width,
      height: data.height,
    }
  } catch (error) {
    console.error('Error fetching Cloudinary metadata:', error)
    return { url: '', alt: '', width: 0, height: 0 }
  }
}
```

## Resources

- [Cloudinary Image Metadata Documentation](https://cloudinary.com/documentation/image_upload_api_reference#metadata)
- [WCAG 2.1 Image ALT Text Guidelines](https://www.w3.org/WAI/tutorials/images/)
- [WebAIM ALT Text Guide](https://webaim.org/techniques/alttext/)

## Questions?

Contact the development team if you need help with:

- Cloudinary API access
- Bulk updating ALT text
- Technical implementation details
