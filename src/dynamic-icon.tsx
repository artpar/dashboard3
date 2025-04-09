// Map entity names to FontAwesome icon components
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'


// Add all icons to the library
library.add(fab, fas, far)

export const DynamicIcon = ({ icon, prefix = 'fas', ...props }) => {
  // Handle cases where icon name might include the prefix
  if (icon && icon.includes(' ')) {
    const [iconPrefix, iconName] = icon.split(' ')
    return <FontAwesomeIcon icon={[iconPrefix, iconName]} {...props} />
  }

  // Handle normal cases with separate prefix and icon name
  return <FontAwesomeIcon icon={[prefix, icon]} {...props} />
}
